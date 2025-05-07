import { createCanvas } from 'canvas';
import fs from 'fs';
import path from 'path';

export function generateCountryTableImage(data) {
  // Calculate total values for all countries
  const totalData = {
    country: 'Total',
    activeUsers: data.reduce((sum, row) => sum + parseInt(row.activeUsers), 0),
    newUsers: data.reduce((sum, row) => sum + parseInt(row.newUsers), 0),
    engagedSessions: data.reduce((sum, row) => sum + parseInt(row.engagedSessions), 0),
    engagementRate: (data.reduce((sum, row) => sum + parseFloat(row.engagementRate), 0) / data.length).toFixed(4),
    engagedSessionsPerUser: (data.reduce((sum, row) => sum + (parseInt(row.engagedSessions) / parseInt(row.activeUsers)), 0) / data.length).toFixed(2),
    averageSessionDuration: (data.reduce((sum, row) => sum + parseFloat(row.averageSessionDuration), 0) / data.length).toFixed(2),
    bounceRate: (data.reduce((sum, row) => sum + parseFloat(row.bounceRate), 0) / data.length).toFixed(4),
    userEngagementDuration: data.reduce((sum, row) => sum + parseInt(row.userEngagementDuration), 0)
  };

  // Keep only India & USA, then put Total at top
  const filtered = data.filter(r => ['India','United States'].includes(r.country));
  filtered.unshift(totalData);

  // Layout
  const width = 1600;
  const margin = 40;
  const headerHeight = 70;
  const rowHeight = 50;
  const colCount = 8;

  // Make first column wider
  const firstColWidth = 280;
  const innerWidth = width - margin*2;
  const otherWidth = (innerWidth - firstColWidth) / (colCount - 1);
  const colWidths = [ firstColWidth, ...Array(colCount-1).fill(otherWidth) ];

  // Helper to get the x-position of a column
  const xPos = i => margin + colWidths.slice(0,i).reduce((a,b) => a + b, 0);

  const height = margin + headerHeight + filtered.length * rowHeight + margin;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, width, height);

  // Title
  ctx.fillStyle = '#333';
  ctx.font = 'bold 30px Sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Country Engagement Report', width/2, margin - 30);

  // Headers
  const wrappedHeaders = [
    ['Country'],
    ['Active','Users'],
    ['New','Users'],
    ['Engaged','Sessions'],
    ['Engaged/','Active User'],
    ['Engagement','Rate'],
    ['Avg Engagement','Time'],
    ['Bounce','Rate']
  ];

  ctx.fillStyle = '#333';
  ctx.font = 'bold 16px Sans-serif';
  wrappedHeaders.forEach((lines, ci) => {
    const cx = xPos(ci) + colWidths[ci]/2;
    lines.forEach((txt, li) => {
      ctx.fillText(txt, cx, margin + 30 + li*20);
    });
  });

  // Data rows
  filtered.forEach((row, ri) => {
    const y = margin + headerHeight + ri * rowHeight;

    // Alternate row shading
    if (row.country === 'United States')      ctx.fillStyle = '#f9f9f9';
    else if (row.country === 'India')         ctx.fillStyle = '#fff';
    else /*Total*/                            ctx.fillStyle = '#fff';
    ctx.fillRect(margin, y, innerWidth, rowHeight);

    // Text
    ctx.fillStyle = '#333';
    ctx.font = '16px Sans-serif';

    const au = parseFloat(row.activeUsers)||0;
    const es = parseFloat(row.engagedSessions)||0;
    const dur = parseFloat(row.userEngagementDuration)||0;
    const avgDur = au>0 ? Math.round(dur/au) : 0;
    const espU = au>0 ? (es/au).toFixed(2) : '0.00';

    const cells = [
      row.country,
      row.activeUsers,
      row.newUsers,
      row.engagedSessions,
      espU,
      `${(parseFloat(row.engagementRate)*100).toFixed(2)}%`,
      `${avgDur}s`,
      `${(parseFloat(row.bounceRate)*100).toFixed(2)}%`
    ];

    cells.forEach((txt, ci) => {
      const alignLeft = ci === 0;
      ctx.textAlign = alignLeft ? 'left' : 'center';
      const off = alignLeft ? 5 : colWidths[ci]/2;
      ctx.fillText(txt, xPos(ci) + off, y + 30);
    });

    // Row line
    ctx.strokeStyle = '#ccc';
    ctx.beginPath();
    ctx.moveTo(margin, y + rowHeight);
    ctx.lineTo(width - margin, y + rowHeight);
    ctx.stroke();
  });

  // Column dividers
  for (let i = 0; i <= colCount; i++) {
    const x = i===0 ? margin : xPos(i);
    ctx.strokeStyle = '#bbb';
    ctx.beginPath();
    ctx.moveTo(x, margin);
    ctx.lineTo(x, height - margin + 10);
    ctx.stroke();
  }

  // Save
  const folder = path.join(process.cwd(), 'graphs');
  if (!fs.existsSync(folder)) fs.mkdirSync(folder);
  const out = path.join(folder, 'country_report.png');
  fs.writeFileSync(out, canvas.toBuffer());
  console.log(`✅ Saved to ${out}`);
  return out;
}
