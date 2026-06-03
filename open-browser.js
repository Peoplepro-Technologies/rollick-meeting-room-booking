// Open browser in development mode
const { exec } = require('child_process');

// Try different browsers
const browsers = [
  'google-chrome',
  'chrome',
  'firefox',
  'opera'
];

const url = 'http://localhost:3000';

function tryBrowser(index) {
  if (index >= browsers.length) {
    console.log('Could not open browser automatically. Please open your browser and navigate to:', url);
    return;
  }

  const command = `${browsers[index]} ${url}`;
  exec(command, (error) => {
    if (error) {
      console.log(`Failed to open with ${browsers[index]}:`, error.message);
      tryBrowser(index + 1);
    } else {
      console.log(`Opened browser with ${browsers[index]}`);
    }
  });
}

tryBrowser(0);