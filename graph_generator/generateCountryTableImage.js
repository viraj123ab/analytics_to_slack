import { createCanvas } from 'canvas';
import fs from 'fs';
import path from 'path';

export function generateCountryTableImage(data) {
    const width = 1600;
    const rowHeight = 55;
    const headerHeight = 70;
    const margin = 60;
    const colCount = 8;
    const colWidth = (width - margin * 2) / colCount;
    const height = margin + headerHeight + rowHeight * data.length + margin;

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Title
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 38px Sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Country Engagement Report', width / 2, margin - 20);

    // Header background
    ctx.fillStyle = '#f2f2f2';
    ctx.fillRect(margin, margin, width - margin * 2, headerHeight);

    // Wrapped header text
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 16px Sans-serif';
    ctx.textAlign = 'left';

    const wrappedHeaders = [
        ['Country'],
        ['Active', 'Users'],
        ['New', 'Users'],
        ['Engaged', 'Sessions'],
        ['Engaged/', 'Active User'],
        ['Engagement', 'Rate'],
        ['Avg Engagement', 'Time'],
        ['Bounce', 'Rate']
    ];

    wrappedHeaders.forEach((lines, i) => {
        lines.forEach((line, j) => {
            ctx.fillText(line, margin + i * colWidth + 10, margin + 25 + j * 18);
        });
    });

    // Data rows
    data.forEach((row, idx) => {
        const y = margin + headerHeight + idx * rowHeight;

        // Alternating row background
        ctx.fillStyle = idx % 2 === 0 ? '#ffffff' : '#fbfbfb';
        ctx.fillRect(margin, y, width - margin * 2, rowHeight);

        // Row text
        ctx.fillStyle = '#444444';
        ctx.font = '18px Sans-serif';

        const activeUsers = parseFloat(row.activeUsers) || 0;
        const engagedSessions = parseFloat(row.engagedSessions) || 0;
        const engagementDuration = parseFloat(row.userEngagementDuration) || 0;
        const avgEngagedTimePerUser = activeUsers > 0 ? (engagementDuration / activeUsers) : 0;
        const engagedSessionsPerUser = activeUsers > 0 ? (engagedSessions / activeUsers).toFixed(2) : '0.00';

        const rowData = [
            row.country,
            row.activeUsers,
            row.newUsers,
            row.engagedSessions,
            engagedSessionsPerUser,
            `${(parseFloat(row.engagementRate) * 100).toFixed(2)}%`,
            `${Math.round(avgEngagedTimePerUser)}s`,
            `${(parseFloat(row.bounceRate) * 100).toFixed(2)}%`
        ];

        rowData.forEach((cell, i) => {
            ctx.fillText(cell, margin + i * colWidth + 15, y + 35);
        });

        // Row separator line
        ctx.strokeStyle = '#e0e0e0';
        ctx.beginPath();
        ctx.moveTo(margin, y + rowHeight);
        ctx.lineTo(width - margin, y + rowHeight);
        ctx.stroke();
    });

    // Column dividers
    for (let i = 0; i <= colCount; i++) {
        const x = margin + i * colWidth;
        ctx.beginPath();
        ctx.moveTo(x, margin);
        ctx.lineTo(x, height - margin + 10);
        ctx.strokeStyle = '#e0e0e0';
        ctx.stroke();
    }

    // Save image
    const folderPath = path.join(process.cwd(), 'graphs');
    if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath);
    const filePath = path.join(folderPath, `country_report.png`);
    fs.writeFileSync(filePath, canvas.toBuffer('image/png'));
    console.log(`✅ Country table saved: ${filePath}`);

    return filePath;
}
