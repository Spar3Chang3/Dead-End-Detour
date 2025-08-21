const Intervals = {
  year: 31536000000, // 365 * 24 * 60 * 60 * 1000
  month: 2592000000,  // 30 * 24 * 60 * 60 * 1000
  day: 86400000,      // 24 * 60 * 60 * 1000
  hour: 3600000,      // 60 * 60 * 1000
  minute: 60000,      // 60 * 1000
  second: 1000
}

function formatApproximateTime(unixMillis) {
  const now = Date.now();
  
  const millisDifference = unixMillis - now;
  
  const suffix = millisDifference < 0 ? 'ago' : 'in the future';
  
  const absDifference = Math.abs(millisDifference);
  
  if (absDifference < Intervals.second) {
    return 'just now';
  }
  
  let counter;
  for (const interval in Intervals) {
    counter = Math.floor(absDifference / Intervals[interval]);
    // So technically since I'm going by object, I can still from the array as if it's an index. Javascript things.
    if (counter > 0) {
      const unit = counter === 1 ? interval : `${interval}s`;
      return `${counter} ${unit} ${suffix}`;
    }
  }
}