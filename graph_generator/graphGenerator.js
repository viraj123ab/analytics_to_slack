import { createCanvas } from 'canvas';
import fs from 'fs';
import path from 'path';

function generateGraph(rawData, label = '30days') {
  const width = 1600;
  const height = 800;
  const margin = { top: 100, right: 80, bottom: 100, left: 100 };
  const graphWidth = width - margin.left - margin.right;
  const graphHeight = height - margin.top - margin.bottom;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // === Background ===
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // === Add Top Title Based on Label ===
  const labelTextMap = {
    'last_7_days': 'Last 7 Days',
    'last_14_days': 'Last 14 Days',
    'last_28_days': 'Last 28 Days',
    'last_30_days': 'Last 30 Days',
    'last_60_days': 'Last 60 Days',
  };

  const title = labelTextMap[label] || label.replace(/_/g, ' ');
  ctx.fillStyle = '#000';
  ctx.font = 'bold 32px Sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`Active Users Trend – ${title}`, width / 2, 60);
  ctx.textAlign = 'start'; // reset for body

  // === Data Preparation ===
  const lastPeriod = rawData.filter(d => d.period === 'last_period').sort((a, b) => a.date.localeCompare(b.date));
  const preceding = rawData.filter(d => d.period === 'preceding_period').sort((a, b) => a.date.localeCompare(b.date));

  const getWeekday = dateStr => new Date(+dateStr.slice(0, 4), +dateStr.slice(4, 6) - 1, +dateStr.slice(6, 8)).getDay();
  const groupByWeekday = data => data.reduce((acc, d) => {
    const day = getWeekday(d.date);
    if (!acc[day]) acc[day] = [];
    acc[day].push(d);
    return acc;
  }, {});

  const groupedRecent = groupByWeekday(lastPeriod);
  const groupedPreceding = groupByWeekday(preceding);

  const alignedData = [];
  for (let day = 0; day < 7; day++) {
    const recents = groupedRecent[day] || [];
    const olds = groupedPreceding[day] || [];
    const len = Math.min(recents.length, olds.length);
    for (let i = 0; i < len; i++) {
      alignedData.push({
        date: recents[i].date,
        last: recents[i].activeUsers,
        preceding: olds[i].activeUsers,
      });
    }
  }

  alignedData.sort((a, b) => a.date.localeCompare(b.date));

  const maxYActual = Math.max(...alignedData.map(d => Math.max(d.last || 0, d.preceding || 0)));

  const niceStep = (max) => {
    const steps = [500, 1000, 2000, 5000, 10000, 20000];
    for (let s of steps) {
      if (max / s <= 6) return s;
    }
    return 5000;
  };

  const step = niceStep(maxYActual);
  const maxY = Math.ceil(maxYActual / step) * step;

  const xStep = graphWidth / (alignedData.length - 1);
  const yScale = graphHeight / maxY;

  // === Header Metrics ===
  const newUsersTotal = lastPeriod.reduce((sum, d) => sum + (d.newUsers || 0), 0);
  const activeUsersTotal = lastPeriod.reduce((sum, d) => sum + (d.activeUsers || 0), 0);
  const avgSessionDuration = lastPeriod.filter(d => d.avgSessionDuration != null).reduce((sum, d) => sum + d.avgSessionDuration, 0) / lastPeriod.length;
  const totalEngagementDuration = lastPeriod.reduce((sum, d) => sum + (d.userEngagementDuration || 0), 0);
  const avgEngagedTimePerUser = totalEngagementDuration / activeUsersTotal;
  console.log("This is the time ",avgEngagedTimePerUser);
  const formatSeconds = (seconds) => {
    let total = Math.ceil(Number(seconds)); // Round up to the nearest integer
    const mins = Math.floor(total / 60); // Calculate minutes
    const secs = total % 60; // Calculate seconds
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };
  

  ctx.fillStyle = '#1a1a1a';
  ctx.font = 'bold 24px Sans-serif';
  ctx.fillText(`New users: ${Math.round(newUsersTotal / 1000)}K`, margin.left, margin.top - 10);
  ctx.fillText(`Active users: ${Math.round(activeUsersTotal / 1000)}K`, margin.left + 300, margin.top - 10);
  ctx.fillText(`Average engagement time per active user: ${formatSeconds(avgEngagedTimePerUser)}`, margin.left + 900, margin.top - 10);

  // === Axes & Gridlines ===
  ctx.strokeStyle = '#cccccc';
  ctx.lineWidth = 1;
  ctx.textAlign = 'right';
  ctx.font = '14px Sans-serif';

  for (let i = 0; i <= maxY; i += step) {
    const y = height - margin.bottom - i * yScale;
    ctx.beginPath();
    ctx.moveTo(margin.left, y);
    ctx.lineTo(width - margin.right, y);
    ctx.stroke();
    ctx.fillStyle = '#555';
    const label = i >= 1000 ? `${i / 1000}K` : `${i}`;
    ctx.fillText(label, margin.left - 10, y + 5);
  }

  // === X-axis labels ===
  ctx.textAlign = 'center';
  alignedData.forEach((d, idx) => {
    if (idx % Math.ceil(alignedData.length / 15) === 0) {
      const x = margin.left + idx * xStep;
      const label = `${d.date.slice(6, 8)} ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][+d.date.slice(4, 6) - 1]}`;
      ctx.fillStyle = '#555';
      ctx.font = '13px Sans-serif';
      ctx.fillText(label, x, height - margin.bottom + 25);
    }
  });

  // === Line Plots ===
  const plotLine = (key, color, dashed = false) => {
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.setLineDash(dashed ? [6, 4] : []);
    let drawing = false;
    alignedData.forEach((d, idx) => {
      const val = d[key];
      const x = margin.left + idx * xStep;
      if (val != null) {
        const y = height - margin.bottom - val * yScale;
        if (!drawing) {
          ctx.moveTo(x, y);
          drawing = true;
        } else {
          ctx.lineTo(x, y);
        }
      } else {
        drawing = false;
      }
    });
    ctx.stroke();
  };

  plotLine('last', '#007bff');
  plotLine('preceding', '#dc3545', true);

  // === Legend ===
  const legendX = width - margin.right - 220;
  const legendY = margin.top;
  ctx.setLineDash([]);
  ctx.fillStyle = '#007bff';
  ctx.fillRect(legendX, legendY, 16, 16);
  ctx.fillStyle = '#222';
  ctx.font = '16px Sans-serif';
  ctx.fillText('Recent Period', legendX + 24, legendY + 13);
  ctx.fillStyle = '#dc3545';
  ctx.fillRect(legendX, legendY + 30, 16, 16);
  ctx.fillStyle = '#222';
  ctx.fillText('Preceding Period', legendX + 24, legendY + 43);

  // === Save Image ===
  const folderPath = path.join(process.cwd(), 'graphs');
  if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath);
  const filePath = path.join(folderPath, `active_users_${label}.png`);
  fs.writeFileSync(filePath, canvas.toBuffer('image/png'));
  console.log(`✅ Graph saved successfully at: ${filePath}`);
  return Math.round(avgEngagedTimePerUser);
}

export default generateGraph;
