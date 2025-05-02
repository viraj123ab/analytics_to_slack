import { google } from 'googleapis';
import dotenv from 'dotenv';
dotenv.config();

const analyticsData = google.analyticsdata('v1beta');

export async function fetchCountryData() {
    const googleKeyFilePath = '/etc/secrets/api.json';
    const ga4PropertyId = process.env.GA4_PROPERTY_ID;

    const auth = new google.auth.GoogleAuth({
        keyFile: googleKeyFilePath,
        scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
    });

    const authClient = await auth.getClient();

    const startDate = '28daysAgo';
    const endDate = 'today';

    const response = await analyticsData.properties.runReport({
        auth: authClient,
        property: `properties/${ga4PropertyId}`,
        requestBody: {
            dateRanges: [{ startDate, endDate }],
            dimensions: [{ name: 'country' }],
            metrics: [
                { name: 'activeUsers' },
                { name: 'newUsers' },
                { name: 'engagedSessions' },
                { name: 'engagementRate' },
                { name: 'averageSessionDuration' },
                { name: 'bounceRate' },
                { name: 'userEngagementDuration' },
            ],
            dimensionFilter: {
                filter: {
                    fieldName: 'country',
                    inListFilter: {
                        values: ['India', 'United States'],
                    },
                },
            },
        },
    });

    const data = response.data.rows.map(row => ({
        country: row.dimensionValues[0].value,
        activeUsers: row.metricValues[0].value,
        newUsers: row.metricValues[1].value,
        engagedSessions: row.metricValues[2].value,
        engagementRate: parseFloat(row.metricValues[3].value).toFixed(4),
        averageSessionDuration: parseFloat(row.metricValues[4].value),
        bounceRate: (parseFloat(row.metricValues[5].value)).toFixed(4),  // Ensuring 4 decimal places
        userEngagementDuration: parseFloat(row.metricValues[6].value),
    }));

    // Ensure that the fetched data is an array before continuing
    if (!Array.isArray(data)) {
        throw new Error('Expected data to be an array');
    }

    return data;  // Return the data after processing
}
