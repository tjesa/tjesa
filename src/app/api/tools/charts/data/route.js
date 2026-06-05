import { NextResponse } from 'next/server';
import { Client } from '@notionhq/client';
import { getAccount, getConfig } from '@/lib/db';

export async function GET(request) {
  const workspaceId = request.cookies.get('tjesa_workspace_id')?.value;

  if (!workspaceId) {
    return NextResponse.json({ error: 'Unauthorized: No active gateway' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const configId = searchParams.get('config_id');

  let databaseId = searchParams.get('database_id');
  let groupByColumn = searchParams.get('group_by_column');
  let aggregateOp = searchParams.get('aggregate_op') || 'count';
  let aggregateColumn = searchParams.get('aggregate_column');

  let account = null;

  try {
    if (configId) {
      // Load config
      const config = await getConfig(configId);
      if (!config) {
        return NextResponse.json({ error: 'Configuration not found' }, { status: 404 });
      }

      // Verify workspace access (support tool suffix and generic fallback)
      const expectedWorkspaceIdCharts = `${workspaceId}_charts`;
      if (config.workspace_id !== expectedWorkspaceIdCharts && config.workspace_id !== workspaceId) {
        return NextResponse.json({ error: 'Forbidden: You do not own this configuration' }, { status: 403 });
      }

      databaseId = config.database_id;
      const settings = config.settings || {};
      groupByColumn = settings.group_by_column;
      aggregateOp = settings.aggregate_op || 'count';
      aggregateColumn = settings.aggregate_column;

      // Retrieve the active Notion account
      account = await getAccount(config.workspace_id);
    }

    if (!account) {
      account = await getAccount(`${workspaceId}_charts`);
    }
    if (!account) {
      account = await getAccount(workspaceId);
    }

    if (!account || !account.access_token) {
      return NextResponse.json({ error: 'Notion connection token not found' }, { status: 404 });
    }

    if (!databaseId || !groupByColumn) {
      return NextResponse.json({ error: 'Missing required parameters (databaseId and groupByColumn)' }, { status: 400 });
    }

    const notion = new Client({ auth: account.access_token });
    
    // Fetch pages
    let hasMore = true;
    let startCursor = undefined;
    const pages = [];

    // Paginate up to 300 pages to avoid timeouts while still providing a good summary
    while (hasMore && pages.length < 300) {
      const response = await notion.dataSources.query({
        data_source_id: databaseId,
        start_cursor: startCursor,
        page_size: 100
      });
      pages.push(...response.results);
      hasMore = response.has_more;
      startCursor = response.next_cursor;
    }

    // Group and aggregate data
    const groups = {};

    pages.forEach(page => {
      const groupProp = page.properties[groupByColumn];
      let labels = [];

      if (groupProp) {
        if (groupProp.type === 'select') {
          labels = [groupProp.select?.name || 'Empty'];
        } else if (groupProp.type === 'status') {
          labels = [groupProp.status?.name || 'Empty'];
        } else if (groupProp.type === 'multi_select') {
          labels = groupProp.multi_select?.map(x => x.name) || [];
          if (labels.length === 0) labels = ['Empty'];
        } else if (groupProp.type === 'checkbox') {
          labels = [groupProp.checkbox ? 'Checked' : 'Unchecked'];
        } else if (groupProp.type === 'date') {
          labels = [groupProp.date?.start ? groupProp.date.start.substring(0, 10) : 'Empty'];
        } else if (groupProp.type === 'rich_text') {
          labels = [groupProp.rich_text?.map(t => t.plain_text).join('') || 'Empty'];
        } else if (groupProp.type === 'title') {
          labels = [groupProp.title?.map(t => t.plain_text).join('') || 'Empty'];
        } else if (groupProp.type === 'url') {
          labels = [groupProp.url || 'Empty'];
        } else if (groupProp.type === 'email') {
          labels = [groupProp.email || 'Empty'];
        } else if (groupProp.type === 'phone_number') {
          labels = [groupProp.phone_number || 'Empty'];
        } else if (groupProp.type === 'number') {
          labels = [groupProp.number !== null && groupProp.number !== undefined ? String(groupProp.number) : 'Empty'];
        } else {
          labels = ['Empty'];
        }
      } else {
        labels = ['Empty'];
      }

      // Determine the value to aggregate
      let val = 1; // Default for count
      if (aggregateOp === 'sum' || aggregateOp === 'avg') {
        const aggProp = page.properties[aggregateColumn];
        if (aggProp && aggProp.type === 'number' && aggProp.number !== null && aggProp.number !== undefined) {
          val = aggProp.number;
        } else {
          val = 0; // Fallback value
        }
      }

      labels.forEach(label => {
        const cleanLabel = label.trim() || 'Empty';
        if (!groups[cleanLabel]) {
          groups[cleanLabel] = [];
        }
        groups[cleanLabel].push(val);
      });
    });

    const labels = Object.keys(groups);
    const values = labels.map(label => {
      const list = groups[label];
      if (aggregateOp === 'sum') {
        const sum = list.reduce((a, b) => a + b, 0);
        return parseFloat(sum.toFixed(2));
      } else if (aggregateOp === 'avg') {
        if (list.length === 0) return 0;
        const avg = list.reduce((a, b) => a + b, 0) / list.length;
        return parseFloat(avg.toFixed(2));
      } else {
        // count
        return list.length;
      }
    });

    return NextResponse.json({
      success: true,
      chartData: {
        labels,
        values
      },
      stats: {
        totalPagesCount: pages.length
      }
    });
  } catch (err) {
    console.error('Error fetching aggregated chart data:', err);
    return NextResponse.json({ error: 'Failed to aggregate database data: ' + err.message }, { status: 500 });
  }
}
