export const emotionsCamille = [
  {emotion: 'happy', image: require('../assets/images/CamilleHappy.png')},
  {emotion: 'sad', image: require('../assets/images/CamilleSad.png')},
  {
    emotion: 'suggestive',
    image: require('../assets/images/CamilleSuggestive.png'),
  },
];

export const emotionsJohn = [
  {emotion: 'happy', image: require('../assets/images/JohnHappy.png')},
  {emotion: 'sad', image: require('../assets/images/JohnSad.png')},
  {
    emotion: 'suggestive',
    image: require('../assets/images/JohnSuggestive.png'),
  },
];

export const emotionsDebbie = [
  {emotion: 'happy', image: require('../assets/images/DebbieHappy.png')},
  {emotion: 'sad', image: require('../assets/images/DebbieSad.png')},
  {
    emotion: 'suggestive',
    image: require('../assets/images/DebbieSuggestive.png'),
  },
];

export const emotionsDan = [
  {emotion: 'happy', image: require('../assets/images/DanHappy.png')},
  {emotion: 'sad', image: require('../assets/images/DanSad.png')},
  {emotion: 'suggestive', image: require('../assets/images/DanSuggestive.png')},
];

export const emotionsMuhammad = [
  {emotion: 'happy', image: require('../assets/images/MuhammadHappy.png')},
  {emotion: 'sad', image: require('../assets/images/MuhammadSad.png')},
  {
    emotion: 'suggestive',
    image: require('../assets/images/MuhammadSuggestive.png'),
  },
];

export const emotionsPrithi = [
  {emotion: 'happy', image: require('../assets/images/PrithiHappy.png')},
  {emotion: 'sad', image: require('../assets/images/PrithiSad.png')},
  {
    emotion: 'suggestive',
    image: require('../assets/images/PrithiSuggestive.png'),
  },
];

export const emotionsBenjamin = [
  {emotion: 'happy', image: require('../assets/images/BenjaminHappy.png')},
  {emotion: 'sad', image: require('../assets/images/BenjaminSad.png')},
  {
    emotion: 'suggestive',
    image: require('../assets/images/BenjaminSuggestive.png'),
  },
];

export const emotionsCandy = [
  {emotion: 'happy', image: require('../assets/images/CandyHappy.png')},
  {emotion: 'sad', image: require('../assets/images/CandySad.png')},
  {
    emotion: 'suggestive',
    image: require('../assets/images/CandySuggestive.png'),
  },
];

export const emotionsMargie = [
  {emotion: 'happy', image: require('../assets/images/MargieHappy.png')},
  {emotion: 'sad', image: require('../assets/images/MargieSad.png')},
  {
    emotion: 'suggestive',
    image: require('../assets/images/MargieSuggestive.png'),
  },
];

export const emotionsProfessor = [
  {
    emotion: 'happy',
    image: require('../assets/images/ProfessorSuggestive.png'),
  },
  {emotion: 'sad', image: require('../assets/images/ProfessorSuggestive.png')},
  {
    emotion: 'suggestive',
    image: require('../assets/images/ProfessorSuggestive.png'),
  },
];

export const emotionsVanessa = [
  {emotion: 'happy', image: require('../assets/images/VanessaHappy.png')},
  {emotion: 'sad', image: require('../assets/images/VanessaSad.png')},
  {
    emotion: 'suggestive',
    image: require('../assets/images/VanessaSuggestive.png'),
  },
];

export const emotionsVictoria = [
  {emotion: 'happy', image: require('../assets/images/VictoriaHappy.png')},
  {emotion: 'sad', image: require('../assets/images/VictoriaSad.png')},
  {
    emotion: 'suggestive',
    image: require('../assets/images/VictoriaSuggestive.png'),
  },
];

export const getEmotionFromResponse = responseJson => {
  if (responseJson.message.includes('Invalid input')) {
    return 'sad';
  }
  if (responseJson.type === 'input' || responseJson.type === 'unknown') {
    return 'suggestive';
  }
  return 'happy';
};

export const packagesImages = {
  GIFTMINDER: require('../assets/images/Benevolence.png'),
  BILLBRIDGE: require('../assets/images/BillPayShare.png'),
  BLOODSHARE: require('../assets/images/BloodShare.png'),
  FLOWPLANNER: require('../assets/images/Flow.png'),
  FOODLINK: require('../assets/images/FoodShare.png'),
  MATHMASTER: require('../assets/images/MathAssistant.png'),
  RESCUEBIDS: require('../assets/images/RescueBids.jpg'),
  REMEMBOT: require('../assets/images/RememBot.png'),
  SHOPSAVVY: require('../assets/images/ShoppingAssistant.png'),
  TASKMASTERAI: require('../assets/images/TodoList.png'),
  EDUCATIONX: require('../assets/images/EducationX.png'),
  DIGITHER: require('../assets/images/DigitHer.png'),
  READYSCHEDULER: require('../assets/images/ReadyScheduler.jpeg'), // New package image
  GOALKEEPER: require('../assets/images/GoalKeeper.jpeg'), // New package image
  CHECKLISTER: require('../assets/images/CheckLister.jpeg'),
};

export const getPackageImage = packageName => {
  switch (packageName) {
    case 'FOODLINK':
      return packagesImages.FOODLINK;
    case 'BLOODSHARE':
      return packagesImages.BLOODSHARE;
    case 'RESCUEBIDS':
      return packagesImages.RESCUEBIDS;
    case 'BILLBRIDGE':
      return packagesImages.BILLBRIDGE;
    case 'EDUCATIONX':
      return packagesImages.EDUCATIONX;
    case 'DIGITHER':
      return packagesImages.DIGITHER;
    case 'other':
      return packagesImages.OTHERLINK;
    default:
      return packagesImages.DEFAULTLINK;
  }
};

export const lineItems = [
  {
    _id: '6538961a989bc612d7ebd655',
    brand: 'New Balance',
    kind: 'Fresh Foam Arishi V4',
    cost: {
      min: 33.08,
      max: 69.99,
    },
    description:
      "The New Balance Men's Fresh Foam Arishi V4 Running Shoe blends engineered cushioning with athletic style, featuring a versatile design with hits of suede and knit.",
    monetaryUnit: 'USD',
    thingName: 'Running Shoe',
    unitName: 'Pair',
    type: 'Athletic Footwear',
    quantity: 0,
  },
  {
    _id: '6538961a989bc612d7ebd656',
    brand: 'Instant Pot',
    kind: '7-in-1 Electric Multi-Cooker',
    cost: {
      min: 99.99,
      max: 179.95,
    },
    description:
      'The Instant Pot 7-in-1 Electric Multi-Cooker combines 7 appliances in one: Pressure cooker, slow cooker, rice cooker, steamer, saute, yogurt maker, and warmer, providing a versatile and convenient solution for various cooking needs.',
    monetaryUnit: 'USD',
    thingName: 'Electric Multi-Cooker',
    unitName: 'Unit',
    type: 'Kitchen Appliances',
    quantity: 0,
  },
  {
    _id: '6538961a989bc612d7ebd657',
    brand: 'MAC',
    kind: 'Matte',
    cost: {
      min: 16.99,
      max: 21.3,
    },
    description:
      "MAC Matte Lipstick is known for its creamy rich formula with high color payoff in a no-shine matte finish. It's long-wearing for up to 10 hours and is non-feathering. The shades range from 'Forever Curious' which is a pinky red, 'Sweet Deal' which is described on Amazon as just 'Lipstick', 'Russian Red', to 'Come Over' which is a nude pink.",
    monetaryUnit: 'USD',
    thingName: 'Matte Lipstick',
    unitName: 'Unit',
    type: 'Cosmetics',
    quantity: 0,
  },
  {
    _id: '6538961a989bc612d7ebd658',
    brand: 'Purina',
    kind: 'Cat Chow Senior Real Chicken Flavor',
    cost: {
      min: 37.95,
      max: 37.95,
    },
    description:
      'Purina Cat Chow Senior Dry Food Bundle includes two bags of dry cat food specifically formulated for senior cats. It comes with a real chicken flavor and includes a paw-shaped food scoop. This bundle is rated 3.4 out of 5 stars on Amazon and is priced at $37.95 per bundle, which contains 2 bags of 3.15LB dry cat food&#8203;``【oaicite:4】``&#8203;.',
    monetaryUnit: 'USD',
    thingName: 'Dry Cat Food',
    unitName: 'Bundle',
    type: 'Pet Food',
    quantity: 0,
  },
  {
    _id: '6538961a989bc612d7ebd659',
    brand: "Ellie's Best",
    kind: 'Pro Quality',
    cost: {
      min: 17.97,
      max: 17.97,
    },
    description:
      'The Pro Quality Nut Milk Bag from Ellie\'s Best is a commercial grade, reusable almond milk bag and all-purpose strainer. It\'s made from fine mesh nylon cheesecloth which makes it perfect for cold brew coffee filtering as well. The bag is big, measuring 12"X12" and comes with free recipes and videos. This nut milk bag is versatile and can be used for making nut milks, juicing, cold brew coffee, yogurt, ghee, sprouting, water filtering, fruit puree, broths, and much more. The product is rated 4.1 out of 5 stars and is priced at $17.97 on Amazon&#8203;``【oaicite:2】``&#8203;&#8203;``【oaicite:1】``&#8203;.',
    monetaryUnit: 'USD',
    thingName: 'Nut Milk Bag',
    unitName: 'Unit',
    type: 'Kitchen Tools',
    quantity: 0,
  },
  {
    _id: '6538961a989bc612d7ebd65a',
    brand: 'Ninja',
    kind: 'Professional',
    cost: {
      min: 59.99,
      max: 239.99,
    },
    description:
      'Ninja blenders come in a variety of models with different capabilities. Some notable models include: 1) Ninja QB1004 Blender/Food Processor with 450-Watt Base, 48oz Pitcher, 16oz Chopper Bowl, and 40oz Processor Bowl for shakes, smoothies, and meal prep priced at $59.99&#8203;``【oaicite:5】``&#8203;. 2) Ninja NJ601AMZ Professional Blender with 1000-Watt Motor & 72 oz Dishwasher-Safe Total Crushing Pitcher for smoothies, shakes & frozen drinks priced at $74.99&#8203;``【oaicite:4】``&#8203;. 3) Ninja BL642 Nutri Ninja Personal & Countertop Blender with 1200W Auto-iQ Base, 72 oz. Pitcher, and 18, 24, & 32 oz. To-Go Cups with Spout Lids for smoothies, shakes & more priced at $239.99&#8203;``【oaicite:3】``&#8203;.',
    monetaryUnit: 'USD',
    thingName: 'Blender',
    unitName: 'Unit',
    type: 'Kitchen Appliance',
    quantity: 0,
  },
  {
    _id: '6538961a989bc612d7ebd65b',
    brand: 'Orgain',
    kind: 'Organic',
    cost: {
      min: 26.99,
      max: 30.99,
    },
    description:
      'Orgain offers a variety of plant-based protein powders. Some notable offerings include: 1) Orgain Organic Vegan Protein Powder + Oat Milk, Vanilla Bean which has 20g Plant Based Protein, and is Gluten Free, Dairy Free, Lactose Free, Soy Free, Low Sugar, Non GMO, and Kosher priced at $26.99&#8203;``【oaicite:3】``&#8203;. 2) Orgain Organic Vegan Protein Powder + Greens, Creamy Chocolate Fudge with 21g Plant Based Protein, Gluten Free, Dairy & Lactose Free, Soy Free, No Sugar Added, Iron & Prebiotics for Gut Health priced at $30.99&#8203;``【oaicite:2】``&#8203;.',
    monetaryUnit: 'USD',
    thingName: 'Plant-Based Protein Powder',
    unitName: 'Unit',
    type: 'Dietary Supplement',
    quantity: 0,
  },
  {
    _id: '6538961a989bc612d7ebd660',
    brand: 'Fitbit',
    kind: 'Fitness Tracker',
    cost: {
      min: 99.95,
      max: 99.95,
    },
    description:
      'The Fitbit Luxe Fitness and Wellness Tracker aids in stress management, sleep tracking, and offers 24/7 heart rate monitoring. It comes in a black/graphite color and is one size with both small and large bands included. Priced at $99.95, it is rated 4.4 out of 5 stars with 7,696 reviews on Amazon&#8203;``【oaicite:2】``&#8203;.',
    monetaryUnit: 'USD',
    thingName: 'Fitbit Luxe Fitness and Wellness Tracker',
    unitName: 'Unit',
    type: 'Fitness Equipment',
    quantity: 2,
    lineItemId: '66000d65d228a92ea3b682ec',
  },
  {
    _id: '6538961a989bc612d7ebd661',
    brand: 'Oral-B',
    kind: 'Electric Toothbrush',
    cost: {
      min: 49.99,
      max: 144,
    },
    description:
      'Oral-B offers a range of electric toothbrushes with different features and price points. For instance, the Oral-B Kids Electric Toothbrush is priced at $49.99 and comes with a coaching pressure sensor and timer, making it suitable for children&#8203;``【oaicite:1】``&#8203;. On the higher end, the Oral-B Genius X Limited Electric Toothbrush, priced at $144.00, comes with artificial intelligence and includes a replacement brush head and a travel case&#8203;``【oaicite:0】``&#8203;.',
    monetaryUnit: 'USD',
    thingName: 'Oral-B Electric Toothbrush',
    unitName: 'Unit',
    type: 'Personal Care Appliance',
    quantity: 0,
  },
  {
    _id: '6538961a989bc612d7ebd662',
    brand: 'Mkono',
    kind: 'Plastic',
    cost: {
      min: 'Price not specified',
      max: 'Price not specified',
    },
    description:
      'Mkono offers a set of 5 plastic plant pots measuring 7.5 inches, ideal for indoor or outdoor use. These pots come with drainage plugs and saucers, along with a drill hole in the base for better water-flow, air penetration, and healthy root growth for live plants&#8203;``【oaicite:0】``&#8203;.',
    monetaryUnit: 'USD',
    thingName: 'Indoor Plant Pot',
    unitName: 'Set',
    type: 'Garden Supply',
    quantity: 0,
  },
  {
    _id: '6538961a989bc612d7ebd663',
    brand: 'Seagate',
    kind: 'External Hard Drive',
    cost: {
      min: 64.99,
      max: 259.99,
    },
    description:
      'Seagate offers a variety of external hard drives with different storage capacities and features. For instance, the Seagate STHP5000400 Backup Plus has a storage capacity of 5TB and is priced at $117.99, suitable for PC, laptop, and Mac with a USB 3.0 connection for faster data transfer&#8203;``【oaicite:2】``&#8203;. The Seagate FireCuda Gaming Hard Drive offers 2TB of storage at a price of $64.99 with RGB LED lighting for PC and Mac&#8203;``【oaicite:1】``&#8203;. The Seagate Expansion 12TB External Hard Drive provides ample storage at $259.99 with USB 3.0 and Rescue Data Recovery Services, suitable for backing up large amounts of data&#8203;``【oaicite:0】``&#8203;.',
    monetaryUnit: 'USD',
    thingName: 'External Hard Drive',
    unitName: 'Unit',
    type: 'Storage Device',
    quantity: 0,
  },
  {
    _id: '6538961a989bc612d7ebd664',
    brand: 'Boyata',
    kind: 'Aluminium Alloy',
    cost: {
      min: 36.99,
      max: 36.99,
    },
    description:
      'Boyata offers a variety of ergonomic laptop stands made from aluminum alloy, compatible with laptops up to 17 inches. These stands are adjustable and designed to reduce neck and back strain while using laptops. The stands come in a space gray color and are priced at $36.99&#8203;``【oaicite:1】``&#8203;.',
    monetaryUnit: 'USD',
    thingName: 'Boyata Laptop Stand',
    unitName: 'Unit',
    type: 'Office Supply',
    quantity: 0,
  },
  {
    _id: '6538961a989bc612d7ebd665',
    brand: 'KRUPS',
    kind: 'Electric',
    cost: {
      min: 19.98,
      max: 19.98,
    },
    description:
      'KRUPS offers a range of electric coffee grinders with different features and price points. For instance, the KRUPS One-Touch Coffee and Spice Grinder is priced at $19.98 and provides a one-touch operation with a 200-watt motor, capable of grinding coffee, spices, dry herbs, and nuts. It has a 12-cup capacity and comes in a black color&#8203;``【oaicite:0】``&#8203;.',
    monetaryUnit: 'USD',
    thingName: 'KRUPS Coffee Grinder',
    unitName: 'Unit',
    type: 'Kitchen Appliance',
    quantity: 0,
  },
  {
    _id: '6538961a989bc612d7ebd666',
    brand: 'Blue Yeti',
    kind: 'USB Microphone',
    cost: {
      min: 'Price not specified',
      max: 'Price not specified',
    },
    description:
      'Blue Yeti offers a range of USB microphones suitable for recording, streaming, gaming, and podcasting on PC and Mac. These microphones come with 3 condenser capsules, 4 pickup patterns, headphone output and volume control, mic gain control, and an adjustable stand for ease of use. They also offer plug & play functionality making them easy to set up and use&#8203;``【oaicite:4】``&#8203;&#8203;``【oaicite:3】``&#8203;&#8203;``【oaicite:2】``&#8203;&#8203;``【oaicite:1】``&#8203;&#8203;``【oaicite:0】``&#8203;.',
    monetaryUnit: 'USD',
    thingName: 'Blue Yeti USB Microphone',
    unitName: 'Unit',
    type: 'Audio Equipment',
    quantity: 0,
  },
  {
    _id: '6538961a989bc612d7ebd667',
    brand: 'Sunbeam',
    kind: 'Electric Heated',
    cost: {
      min: 77.62,
      max: 119.95,
    },
    description:
      'Sunbeam offers a variety of electric heated blankets suitable for keeping warm during cold weather. They come in various sizes including king, queen, and twin, with different heat settings and auto shut-off features for safety. The blankets are machine washable and come with digital controllers for easy temperature adjustment. Some models offer plush or luxurious velvet material for added comfort, and prices range from $77.62 to $119.95 based on the size and features&#8203;``【oaicite:4】``&#8203;&#8203;``【oaicite:3】``&#8203;&#8203;``【oaicite:2】``&#8203;&#8203;``【oaicite:1】``&#8203;&#8203;``【oaicite:0】``&#8203;.',
    monetaryUnit: 'USD',
    thingName: 'Sunbeam Electric Blanket',
    unitName: 'Unit',
    type: 'Bedding',
    quantity: 0,
  },
  {
    _id: '6538961a989bc612d7ebd668',
    brand: 'Jabra',
    kind: 'True Wireless',
    cost: {
      min: 54.73,
      max: 69.99,
    },
    description:
      'Jabra offers a range of true wireless earbuds with different features and price points. For instance, the Jabra Elite 4 True Wireless Earbuds are priced at $69.99 and come with active noise cancelling, comfortable fit, and are compatible with laptops, iOS, and Android devices. They are available in dark grey color&#8203;``【oaicite:7】``&#8203;&#8203;``【oaicite:6】``&#8203;. The Jabra Elite 85t Wireless Earbuds are engineered for a superior calls and music experience with adjustable sound and Advanced Active Noise Cancellation technology&#8203;``【oaicite:5】``&#8203;. The Jabra Elite Active 75t True Wireless Earbuds are designed for running and sport with a charging case included, 24-hour battery life, and active noise cancelling features&#8203;``【oaicite:4】``&#8203;.',
    monetaryUnit: 'USD',
    thingName: 'Jabra Wireless Earbuds',
    unitName: 'Pair',
    type: 'Audio Equipment',
    quantity: 0,
  },
  {
    _id: '6538961a989bc612d7ebd669',
    brand: 'COSORI',
    kind: 'Air Fryer',
    cost: {
      min: 49.99,
      max: 129.99,
    },
    description:
      'COSORI offers a variety of air fryers with different capacities and cooking functions. For example, the COSORI Pro II Air Fryer Oven Combo, priced at $129.99, has a large 5.8QT capacity with 12 one-touch savable custom functions, a nonstick and dishwasher-safe detachable square basket, and comes in black color&#8203;``【oaicite:3】``&#8203;&#8203;``【oaicite:2】``&#8203;. The COSORI Air Fryer 4 Qt, priced at $49.99, offers 13 cooking functions, dishwasher-safe basket, and a free app with over 100 recipes, designed for 1-3 people with a 4.0-quart capacity&#8203;``【oaicite:1】``&#8203;&#8203;``【oaicite:0】``&#8203;.',
    monetaryUnit: 'USD',
    thingName: 'COSORI Air Fryer',
    unitName: 'Unit',
    type: 'Kitchen Appliance',
    quantity: 0,
  },
  {
    _id: '6538961a989bc612d7ebd66b',
    brand: 'Panasonic',
    kind: 'True Wireless',
    cost: {
      min: 8.99,
      max: 110.8,
    },
    description:
      'Panasonic offers a range of electronic earbuds with various features. For instance, the Panasonic RZ-S500W True Wireless Earbuds come with active noise cancelling, dual-hybrid technology, powerful 8mm drivers for premium sound, advanced voice isolation for clear calls, IPX4 water resistance, voice assistant, and touch sensors&#8203;``【oaicite:2】``&#8203;. The Panasonic ErgoFit True Wireless Earbuds have noise cancelling, in-ear headphones with XBS Powerful Bass, Bluetooth 5.3, and a charging case&#8203;``【oaicite:1】``&#8203;. The Panasonic ErgoFit Wired Earbuds are in-ear headphones with dynamic crystal-clear sound and ergonomic custom-fit earpieces, priced at $8.99&#8203;``【oaicite:0】``&#8203;.',
    monetaryUnit: 'USD',
    thingName: 'Panasonic Electronic Earbuds',
    unitName: 'Pair',
    type: 'Audio Equipment',
    quantity: 0,
  },
  {
    _id: '6538961a989bc612d7ebd66a',
    brand: 'Silk',
    kind: 'Almond',
    cost: {
      min: '3.69',
      max: '10.84',
    },
    description:
      'Silk Unsweetened Almond Milk in Vanilla flavor is a dairy-free, gluten-free beverage made from almonds. It has zero grams of sugar per serving, and is an excellent source of calcium and antioxidant vitamin E. This plant-based milk is also free from carrageenan and artificial colors & flavors, and is verified by the Non-GMO Project’s product verification program&#8203;``【oaicite:5】``&#8203;&#8203;``【oaicite:4】``&#8203;&#8203;``【oaicite:3】``&#8203;.',
    monetaryUnit: 'USD',
    thingName: 'Silk Unsweetened Almond Milk Vanilla',
    unitName: 'Carton',
    type: 'Plant-Based Beverage',
    quantity: 0,
  },
];

export const sortTodoList = items => {
  let emergencyTodoList = items.filter(item => item.isEmergency);
  let nonEmergencyTodoList = items.filter(item => !item.isEmergency);
  emergencyTodoList.sort(
    (a, b) => new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime(),
  );
  nonEmergencyTodoList.sort(
    (a, b) => new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime(),
  );
  return emergencyTodoList.concat(nonEmergencyTodoList);
};
