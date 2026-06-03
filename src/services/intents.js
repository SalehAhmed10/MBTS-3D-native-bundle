const availableIntents = {
  BENEVOLENCE: [
    'i want to see events coming up',
    'i want to see wishlists',
    'i want to buy gifts for my loved ones',
  ],
  REMEMBOT: ['i want to remember something', 'i want to recall something'],
  FOODSHARE: [
    "i'm hungry",
    'i am hungry',
    'i want to share some food',
    'i have food to share',
  ],
  BILLPAYSHARE: ['i need help with a bill'],
  RESCUEBIDS: ['i want to avoid a bank fee', 'i need a small loan'],
  BLOODSHARE: ['i need blood', 'i have blood to share'],
  SHOPPINGASSISTANT: [
    'add an item to my shopping list',
    'remove an item from my shopping list',
    "what's on my shopping list",
    'i want to add items to my shopping list',
    'i want to see my shopping list',
    'i want to change my shopping list',
    "i've purchased some items on my shopping list",
    'i have purchased some items on my shopping list',
  ],
  TASKMASTERAI: [
    'i want to add a to do list item to my list',
    'add a to do list item',
    'i want to add a to do list item',
    'i want to see my to do list',
    'show to do list',
    'show my to do list',
    'i want to change my to do list',
    'i want to edit my to do list',
    'i want to remove items from my to do list',
  ],
  MATH: ['compute xsquaredplusone', 'compute xplusonesquared'],
  FREEMIUM: [
    'add an item to my shopping list',
    'remove an item from my shopping list',
    "what's on my shopping list",
    'i want to add items to my shopping list',
    'i want to see my shopping list',
    'i want to change my shopping list',
    "i've purchased some items on my shopping list",
    'i have purchased some items on my shopping list',
    'compute xsquaredplusone',
    'compute xplusonesquared',
  ],
  FLOWPLANNER: [
    'flow',
    'create a flow plan for me',
    'create a flow plan',
    'create my day schedule',
    'give me a flow plan',
    'I need a flow plan for today',
    'help me set up my flow plan',
    'generate my daily flow plan',
    'plan my day for me',
    'I want to organize my flow plan',
    'show me my flow plan',
    'assist me with my daily schedule',
    'make a flow plan for tomorrow',
    'create a detailed flow plan',
    'I need a plan for my day',
    'give me a structured flow plan',
    'set my flow plan',
    'design my daily flow',
    'help me with my daily flow plan',
  ],
};

const checkIntent = intent => {
  // Check if the intent exists in any of the available packages
  for (const packageName in availableIntents) {
    if (availableIntents[packageName].includes(intent.toLowerCase())) {
      return true;
    }
  }
  return false;
};

export {availableIntents, checkIntent};
