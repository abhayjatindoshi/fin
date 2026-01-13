import TagIcons from "@/modules/app-ui/icons/tags/TagIcons";

type SystemTags = Record<string, {
	icon?: keyof typeof TagIcons;
	description?: string;
	children?: SystemTags;
}>;

const tags: SystemTags = {
	"Bills": {
		icon: "receipt-text",
		children: {
			"Electricity": { icon: "zap" },
			"Gas": { icon: "gas" },
			"Internet": { icon: "wifi" },
			"Mobile": { icon: "tablet-smartphone" },
			"DTH": { icon: "satellite-dish" },
			"Water": { icon: "droplet" },
		}
	},
	"Borrowed": { icon: "hand-helping" },
	"Cash Deposit": { icon: "banknote-arrow-up" },
	"Cash Withdrawal": { icon: "banknote-arrow-down" },
	"Cashback": {
		icon: "coins",
		children: {
			"Google Pay": { icon: "googlepay" },
			"Paytm": { icon: "paytm" },
			"PhonePe": { icon: "phonepe" },
		}
	},
	"Commute": {
		icon: "car-front",
		children: {
			"Auto": { icon: "auto" },
			"Bus": { icon: "bus" },
			"Ola": { icon: "ola" },
			"Uber": { icon: "uber" },
			"Rapido": { icon: "rapido" },
			"Namma Yatri": { icon: "namma-yatri" },
			"Cab": { icon: "car-taxi-front" },
			"Train": { icon: "train-track" },
			"Metro": { icon: "train-front" },
			"Fuel": { icon: "fuel" },
			"Fine": { icon: "whistle" },
			"EV Charge": { icon: "battery-charging" },
			"Local Rental": { icon: "car" },
		}
	},
	"Credit & Pay Later": {
		icon: "credit-card",
		children: {
			"Amazon Pay": { icon: "amazon-pay" },
			"CRED": { icon: "cred" },
			"Credit Card": { icon: "credit-card" },
			"LazyPay": { icon: "lazypay" },
			"Simpl": { icon: "simpl" },
			"Slice": { icon: "slice" },
		}
	},
	"Dining Out": {
		icon: "utensils",
		children: {
			"Dineout": { icon: "swiggy" },
			"District": { icon: "district" },
			"EazyDiner": {},
			"Restaurant": { icon: "utensils" },
			"Street Food": {},
			"Breakfast": { icon: "croissant" },
		}
	},
	"Donation": { icon: "heart-plus" },
	"Eating In": {
		icon: "salad",
		children: {
			"Tea & Coffee": { icon: "coffee" },
			"Tiffin": { icon: "tiffin" },
			"Swiggy": { icon: "swiggy" },
			"Zomato": { icon: "zomato" },
			"Delivery": { icon: "bike-fast" },
			"Pizza": { icon: "pizza" },
			"Burger": { icon: "hamburger" },
			"Fast Food": { icon: "hamburger" },
			"Dessert": { icon: "ice-cream-bowl" },
			"Takeaway": { icon: "brownbag" },
		}
	},
	"EMI": {
		icon: "landmark",
		children: {
			"Education": { icon: "graduation-cap" },
			"Electronics": { icon: "laptop" },
			"House": { icon: "house" },
			"Vehicle": { icon: "car" },
		}
	},
	"Entertainment": {
		icon: "monitor-play",
		children: {
			"Bowling": { icon: "bowling" },
			"Movies": { icon: "clapperboard" },
			"Concerts": { icon: "mic" },
			"Shows": { icon: "mic" },
			"Leisure": { icon: "tickets" },
		}
	},
	"Events": {
		icon: "calendar",
		children: {
			"Party": { icon: "party-popper" },
			"Spiritual": { icon: "flame" },
			"Wedding": { icon: "gem" },
		}
	},
	"Fitness": {
		icon: "dumbbell",
		children: {
			"Badminton": { icon: "shuttlecock" },
			"Classes": { icon: "calendar-days" },
			"Cricket": { icon: "fitness-cricket" },
			"Equipment": { icon: "dumbbell" },
			"Football": { icon: "fitness-football" },
			"Gym": { icon: "biceps-flexed" },
			"Nutrition": { icon: "pill-bottle" },
		}
	},
	"Gift": { icon: "gift" },
	"Groceries": {
		icon: "grape",
		children: {
			"Dairy": { icon: "milk" },
			"Bakery": { icon: "croissant" },
			"Chips": { icon: "cookie" },
			"Supermarket": { icon: "shopping-cart" },
			"Zepto": { icon: "zepto" },
			"Instamart": { icon: "swiggy" },
			"Blinkit": { icon: "blinkit" },
		}
	},
	"House": {
		icon: "house",
		children: {
			"Rent": { icon: "house" },
			"Maintenance": { icon: "building" },
		}
	},
	"Income": {
		icon: "hand-coins",
		children: {
			"Interest": { icon: "sparkles" },
			"Dividends": { icon: "diamond-percent" },
			"Salary": { icon: "banknote-arrow-down" },
			"Freelance": { icon: "laptop" },
			"Rent": { icon: "house" },
		}
	},
	"Insurance": {
		icon: "shield-user",
		children: {
			"Health": { icon: "cross" },
			"Life": { icon: "house-heart" },
			"Vehicle": { icon: "car" },
		}
	},
	"Investments": {
		icon: "chart-candlestick",
		children: {
			"Fixed Deposits": { icon: "vault" },
			"Gold": { icon: "goldbar" },
			"Silver": { icon: "goldbar" },
			"Mutual Funds": { icon: "sprout" },
			"NPS": { icon: "nps" },
			"PPF": { icon: "ppf" },
			"Recurring Deposit": { icon: "vault" },
			"Stocks": { icon: "chart-candlestick" },
			"ULIP": { icon: "shield-user" },
		}
	},
	"Lent": { icon: "handshake" },
	"Logistics": {
		icon: "truck",
		children: {
			"Packers & Movers": { icon: "truck" },
			"Courier": { icon: "package" },
		}
	},
	"Medical": {
		icon: "pill",
		children: {
			"Clinic": { icon: "stethoscope" },
			"Dentist": { icon: "tooth" },
			"Hospital": { icon: "hospital" },
			"Hygiene": { icon: "sparkles" },
			"Lab Tests": { icon: "syringe" },
			"Medicines": { icon: "pill" },
		}
	},
	"Personal": {
		icon: "user",
		children: {
			"Grooming": { icon: "scissors" },
			"Parlour": { icon: "scissors" },
			"Spa": { icon: "heart" },
		}
	},
	"Pet Care": {
		icon: "paw-print",
		children: {
			"Food": { icon: "soup" },
			"Grooming": { icon: "scissors" },
			"Toys": { icon: "toy-brick" },
			"Vet": { icon: "stethoscope" },
		}
	},
	"Professional": {
		icon: "briefcase",
		children: {
			"CA": { icon: "glasses" },
			"Legal": { icon: "scale" },
		}
	},
	"Self Transfer": { icon: "arrow-left-right" },
	"Services": {
		icon: "hand-platter",
		children: {
			"Painting": { icon: "paint-roller" },
			"Maid": { icon: "brush-cleaning" },
			"Cook": { icon: "chef-hat" },
			"Laundry": { icon: "washing-machine" },
			"Electrician": { icon: "cable" },
			"Plumber": { icon: "wrench" },
			"Mechanic": { icon: "car" },
			"Carpenter": { icon: "hammer" },
			"Driver": { icon: "car" },
			"Photographer": { icon: "camera" },
			"Tailor": {},
		}
	},
	"Shopping": {
		icon: "shopping-bag",
		children: {
			"Clothes": { icon: "shirt" },
			"Cosmetics": { icon: "makeup" },
			"Mobile & Accessories": { icon: "tablet-smartphone" },
			"Furniture": { icon: "sofa" },
			"Electronics": { icon: "laptop" },
			"Appliances": { icon: "shopping-appliance" },
			"Plants": { icon: "sprout" },
			"Footwear": { icon: "footprints" },
			"Jewellery": { icon: "gem" },
			"Devotional": { icon: "shopping-devotional" },
			"Wedding": { icon: "gem" },
		}
	},
	"Support": {
		icon: "heart-plus",
		children: {
			"Dad": { icon: "aid-father" },
			"Mom": { icon: "aid-mother" },
			"Parents": { icon: "aid-walking-stick" },
			"Pocket Money": { icon: "wallet" },
			"Spouse": { icon: "heart-handshake" },
		}
	},
	"Tax": {
		icon: "badge-indian-rupee",
		children: {
			"Water Tax": { icon: "badge-indian-rupee" },
			"Property Tax": { icon: "badge-indian-rupee" },
			"Income Tax": { icon: "badge-indian-rupee" },
			"GST": { icon: "badge-indian-rupee" },
		}
	},
	"Travel": {
		icon: "car-front",
		children: {
			"Car": { icon: "car" },
			"Bus": { icon: "bus" },
			"Train": { icon: "train-track" },
			"Flights": { icon: "plane" },
			"FASTag": { icon: "fastag" },
			"Tolls": { icon: "construction" },
			"Lounge": { icon: "armchair" },
			"Car Rental": { icon: "car" },
		}
	},
	"Trips": {
		icon: "plane",
		children: {
			"Hotel": { icon: "bed" },
			"Hostel": { icon: "backpack" },
			"Meals": { icon: "utensils" },
			"Activities": { icon: "tent-tree" },
			"Airbnb": { icon: "airbnb" },
			"Camping": { icon: "tent" },
			"Visa": { icon: "stamp" },
		}
	},
	"Subscription": {
		icon: "calendar-sync",
		children: {
			"Apple": { icon: "apple" },
			"Bumble": { icon: "bumble" },
			"Google": { icon: "google" },
			"Learning": { icon: "graduation-cap" },
			"Netflix": { icon: "netflix" },
			"News": { icon: "newspaper" },
			"Prime": { icon: "amazon-prime-video" },
			"Software": { icon: "app-window" },
			"Spotify": { icon: "spotify" },
			"YouTube": { icon: "youtube" },
		}
	}
};

export default tags;