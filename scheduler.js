import getAnalyticsData from './data_fetcher/googleAnalytics.js';
import sendToSlack from './slack_notifier/slack_notifier.js';
import cron from 'node-cron';
import { fetchCountryData } from './data_fetcher/fetchCountryData.js';
import { generateCountryTableImage } from './graph_generator/generateCountryTableImage.js';
import { sendCountryReportToSlack } from './slack_notifier/sendCountryReportToSlack.js';

// Schedule task to run every day at

// Schedule task to run every day at 9:30 AM

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
cron.schedule('30 9 * * *', async () => {
  try {
    console.log('Fetching data from Google Analytics...');
    const analyticsData = await getAnalyticsData();
    console.log('Generating graph...');
    await sendToSlack(analyticsData);
    console.log('Report1 sent to Slack successfully!');

    await delay(5000);

   // Step 1: Fetch country-level data from Google Analytics
   console.log('Fetching country-level data from Google Analytics...');
   const countryData = await fetchCountryData();  
   console.log('Generating country table image...');
   const imagePath = generateCountryTableImage(countryData);  
   console.log('Sending country report to Slack...');
   await sendCountryReportToSlack(countryData,imagePath);  // Pass the country data (newData) to this function

   console.log('Country report sent to Slack successfully!');


  } catch (error) {
    console.error('Error during automation:', error);
  }
});
