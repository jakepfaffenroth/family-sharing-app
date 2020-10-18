// TODO - Make this work as a separate module

export default (owner, usage) => {
  function storagePercentage() {
    return (usage.mb / owner.quota) * 100;
  }

  function usageValue() {
    if (usage.gb >= 1) return { value: usage.gb.toFixed(2), unit: 'GB' };
    else if (usage.mb >= 1) return { value: usage.mb.toFixed(2), unit: 'MB' };
    else return { value: usage.kb.toFixed(2), unit: 'KB' };
  }
  function barWidth() {
    return storagePercentage() > 2
      ? 'width: ' + storagePercentage() + '%'
      : 'width: ' + 2 + '%';
  }
  function barColor() {
    if (storagePercentage() < 40) {
      return 'green-400';
    } else if (this.storagePercentage() < 90) {
      return 'orange-400';
    } else {
      return 'red-500';
    }
  }
};
