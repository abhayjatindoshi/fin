import TagIcons from "@/modules/app-ui/icons/tags/TagIcons";
import type { Tag } from "../entities/Tag";

type SystemTags = Record<string, {
    icon: keyof typeof TagIcons;
    description?: string;
    children?: SystemTags;
}>;

const tags: SystemTags = {
    "Bill": {
        icon: "receipt-text", description: "Rent, Wi-fi, electricity and other bills", children: {
            "Cook": { icon: "chef-hat" },
            "DTH": { icon: "satellite-dish" },
            "Education": { icon: "graduation-cap" },
            "Electricity": { icon: "zap" },
            "Gas": { icon: "gas" },
            "House help": { icon: "brush-cleaning" },
            "Internet": { icon: "wifi" },
            "Maintenance": { icon: "building" },
            "Phone": { icon: "tablet-smartphone" },
            "Rent": { icon: "house" },
            "Water": { icon: "droplet" },
        }
    },
    "Borrowed": { icon: "hand-helping", description: "Money borrowed, to be returned" },
    "Cash Deposit": { icon: "banknote-arrow-up", description: "Cash deposited at a physical branch" },
    "Cash Withdrawal": { icon: "banknote-arrow-down", description: "Cash taken out from ATM or Bank" },
    "Cashback": {
        icon: "coins", description: "Rewards from GPay, PhonePe etc.", children: {
            "Google Pay": { icon: "googlepay" },
            "Paytm": { icon: "paytm" },
            "PhonePe": { icon: "phonepe" },
        }
    },
    "Credit Bill": {
        icon: "credit-card", description: "Credit Card & BNPL services settlement", children: {
            "Amazon Pay": { icon: "amazon" },
            "Credit card": { icon: "credit-card" },
            "Lazypay": { icon: "lazypay" },
            "Simpl": { icon: "simpl" },
            "Slice": { icon: "slice" },
        }
    },
    "Dividends": { icon: "diamond-percent", description: "Returns on stock investment" },
    "Donation": { icon: "heart-plus", description: "Contributions to charities and NGOs" },
    "Earnings": {
        icon: "hand-coins", description: "Income from sources other than salary", children: {
            "Freelance": { icon: "laptop" },
            "Rent": { icon: "house" },
            "Various": { icon: "wand-sparkles" },
        }
    },
    "EMI": {
        icon: "landmark", description: "Repayment of Loan", children: {
            "Education": { icon: "graduation-cap" },
            "Electronics": { icon: "laptop" },
            "House": { icon: "house" },
            "Vehicle": { icon: "car" },
        }
    },
    "Entertainment": {
        icon: "monitor-play", description: "Movies, Concerts and other recreations", children: {
            "Bowling": { icon: "bowling" },
            "Movies": { icon: "clapperboard" },
            "Others": { icon: "tickets" },
            "Shows": { icon: "mic" },
        }
    },
    "Events": {
        icon: "calendar", description: "Being social while putting a dent in your bank account", children: {
            "Party": { icon: "party-popper" },
            "Spiritual": { icon: "flame" },
            "Wedding": { icon: "gem" },
        }
    },
    "Fitness": {
        icon: "dumbbell", description: "Things to keep your biological machinery in tune", children: {
            "Badminton": { icon: "shuttlecock" },
            "Classes": { icon: "calendar-days" },
            "Cricket": { icon: "fitness-cricket" },
            "Equipment": { icon: "dumbbell" },
            "Football": { icon: "fitness-football" },
            "Gym": { icon: "biceps-flexed" },
            "Nutrition": { icon: "pill-bottle" },
        }
    },
    "Food & Drinks": {
        icon: "salad", description: "Eating food outside", children: {
            "Beverages": { icon: "glass-water" },
            "Date": { icon: "rose" },
            "Dessert": { icon: "ice-cream-bowl" },
            "Eating out": { icon: "utensils" },
            "Fast Food": { icon: "hamburger" },
            "Liquor": { icon: "beer" },
            "Pizza": { icon: "pizza" },
            "Snacks": { icon: "cookie" },
            "Swiggy": { icon: "swiggy" },
            "Take Away": { icon: "brownbag" },
            "Tea & Coffee": { icon: "coffee" },
            "Tiffin": { icon: "tiffin" },
            "Zomato": { icon: "zomato" },
        }
    },
    "Gift": { icon: "gift", description: "Money received as gift, not to return" },
    "Groceries": {
        icon: "grape", description: "Kitchen and other household supplies", children: {
            "Bakery": { icon: "croissant" },
            "Dairy": { icon: "milk" },
            "Fruits": { icon: "banana" },
            "Meat": { icon: "drumstick" },
            "Staples": { icon: "wheat" },
            "Vegetables": { icon: "carrot" },
            "Zepto": { icon: "zepto" },
        }
    },
    "Hidden Charges": { icon: "eye-closed", description: "Banks’ hidden subscription charges" },
    "Insurance": {
        icon: "shield-user", description: "Payment towards insurance premiums", children: {
            "Electronics": { icon: "laptop" },
            "Health": { icon: "cross" },
            "Life": { icon: "house-heart" },
            "Vehicle": { icon: "car" },
        }
    },
    "Interest": {
        icon: "sparkles", description: "Interest earned on savings account"
    },
    "Investment": {
        icon: "chart-candlestick", description: "Money put towards investment", children: {
            "Assets": { icon: "piggy-bank" },
            "Crypto": { icon: "bitcoin" },
            "Fixed Deposit": { icon: "vault" },
            "Gold": { icon: "goldbar" },
            "Mutual Funds": { icon: "sprout" },
            "NPS": { icon: "nps" },
            "PPF": { icon: "ppf" },
            "Recurring Deposit": { icon: "vault" },
            "Stocks": { icon: "chart-candlestick" },
        }
    },
    "Lent": { icon: "handshake", description: "Money lent with expectation of return" },
    "Medical": {
        icon: "pill", description: "Medicines, Doctor consulation etc.", children: {
            "Clinic": { icon: "stethoscope" },
            "Dentist": { icon: "tooth" },
            "Hospital": { icon: "hospital" },
            "Hygiene": { icon: "sparkles" },
            "Lab test": { icon: "syringe" },
            "Medicines": { icon: "pill" },
        }
    },
    "Misc.": {
        icon: "circle-dot-dashed", description: "Everything else", children: {
            "Forex": { icon: "circle-dollar-sign" },
            "Tip": { icon: "receipt-indian-rupee" },
            "Verification": { icon: "brick-wall-shield" },
        }
    },
    "Personal": {
        icon: "user", description: "Money spent on & for yourself", children: {
            "Grooming": { icon: "scissors" },
            "Hobbies": { icon: "palette" },
            "Self-care": { icon: "heart" },
            "Therapy": { icon: "book-heart" },
            "Vices": { icon: "cigarette" },
        }
    },
    "Pet Care": {
        icon: "paw-print", description: "Money spent taking care of your snugglebug", children: {
            "Food": { icon: "soup" },
            "Grooming": { icon: "scissors" },
            "Toys": { icon: "toy-brick" },
            "Vet": { icon: "stethoscope" },
        }
    },
    "Pocket Money": { icon: "wallet", description: "Support from loved ones" },
    "Redemption": { icon: "trending-up-down", description: "Money redeemed from investments" },
    "Refund": { icon: "rotate-ccw", description: "Refunds & Reimbursements" },
    "Return": { icon: "corner-down-left", description: "Borrowed money is returned" },
    "Salary": { icon: "banknote-arrow-down", description: "Monthly, regular income" },
    "Savings": { icon: "piggy-bank", description: "For goals and dreams" },
    "Self Transfer": { icon: "arrow-left-right", description: "Transfer between personal Bank accounts" },
    "Services": {
        icon: "hand-platter", description: "Professional tasks provided for a fee", children: {
            "Advisor": { icon: "glasses" },
            "Courier": { icon: "package" },
            "Driver": { icon: "car" },
            "Electrician": { icon: "cable" },
            "Laundry": { icon: "washing-machine" },
            "Legal": { icon: "scale" },
            "Logistics": { icon: "truck" },
            "Mechanic": { icon: "car" },
            "Painting": { icon: "paint-roller" },
            "Photographer": { icon: "camera" },
            "Plumber": { icon: "wrench" },
            "Repair": { icon: "hammer" },
            "Vehicle Wash": { icon: "car" },
            "Xerox": { icon: "printer" },
        }
    },
    "Shopping": {
        icon: "shopping-bag", description: "Clothes, shoes, furniture etc.", children: {
            "Appliances": { icon: "shopping-appliance" },
            "Books": { icon: "library-big" },
            "Clothes": { icon: "shirt" },
            "Cosmetics": { icon: "makeup" },
            "Devotional": { icon: "shopping-devotional" },
            "Electronics": { icon: "laptop" },
            "Furniture": { icon: "sofa" },
            "Glasses": { icon: "glasses" },
            "Jewellery": { icon: "gem" },
            "Plants": { icon: "sprout" },
            "Shoes": { icon: "footprints" },
            "Stationery": { icon: "pencil-ruler" },
            "Toys": { icon: "toy-brick" },
            "Vehicle": { icon: "car" },
            "Video games": { icon: "gamepad-2" },
        }
    },
    "Subscription": {
        icon: "calendar-sync", description: "Recurring payment to online services", children: {
            "Apple": { icon: "apple" },
            "Bumble": { icon: "bumble" },
            "Google": { icon: "google" },
            "Learning": { icon: "graduation-cap" },
            "Netflix": { icon: "netflix" },
            "News": { icon: "newspaper" },
            "Prime": { icon: "amazon" },
            "Software": { icon: "app-window" },
            "Spotify": { icon: "spotify" },
            "YouTube": { icon: "youtube" },
        }
    },
    "Support": {
        icon: "heart-plus", description: "Financial support for loved ones", children: {
            "Dad": { icon: "aid-father" },
            "Mom": { icon: "aid-mother" },
            "Parents": { icon: "aid-walking-stick" },
            "Pocket Money": { icon: "wallet" },
            "Spouse": { icon: "heart-handshake" },
        }
    },
    "Tax": {
        icon: "badge-indian-rupee", description: "Income tax, property tax, e.t.c", children: {
            "GST": { icon: "badge-indian-rupee" },
            "Income Tax": { icon: "badge-indian-rupee" },
            "Property Tax": { icon: "badge-indian-rupee" },
        }
    },
    "Top-up": {
        icon: "arrow-left-right", description: "Money added to online wallets", children: {
            "Amazon": { icon: "amazon" },
            "Others": { icon: "wallet" },
            "Paytm": { icon: "paytm" },
            "PhonePe": { icon: "phonepe" },
            "UPI Lite": { icon: "upi" },
        }
    },
    "Transport": {
        icon: "car-front", description: "Uber, Ola and other modes of transport", children: {
            "Auto": { icon: "auto" },
            "Bike": { icon: "motorbike" },
            "Bus": { icon: "bus" },
            "Cab": { icon: "car-taxi-front" },
            "FASTag": { icon: "fastag" },
            "Fine": { icon: "whistle" },
            "Flights": { icon: "plane" },
            "Lounge": { icon: "armchair" },
            "Metro": { icon: "train-front" },
            "Parking": { icon: "circle-parking" },
            "Petrol": { icon: "fuel" },
            "Rapido": { icon: "rapido" },
            "Tolls": { icon: "construction" },
            "Train": { icon: "train-track" },
            "Uber": { icon: "uber" },
        }
    },
    "Travel": {
        icon: "plane", description: "Exploration, fun and vacations!", children: {
            "Activities": { icon: "tent-tree" },
            "Airbnb": { icon: "airbnb" },
            "Camping": { icon: "tent" },
            "Hostel": { icon: "backpack" },
            "Hotel": { icon: "bed" },
        }
    },
};

const cleanForId = (name: string): string => {
    return name.replaceAll(/[^\w]/g, '')
        .toLowerCase();
}
const icons = Object.keys(TagIcons);

export const SystemTags: Record<string, Tag> = {};

Object.entries(tags).forEach(([name, tag]) => {
    const cleanName = cleanForId(name);
    const id = 'system-tag-' + cleanName;

    if (!icons.includes(tag.icon)) {
        tag.icon = "binary";
    }

    SystemTags[id] = {
        id,
        name: name,
        icon: tag.icon,
        description: tag.description,
    } as Tag;

    for (const childName in tag.children) {
        const child = tag.children[childName];
        const childId = `system-tag-${cleanName}-${cleanForId(childName)}`;

        if (!icons.includes(child.icon)) {
            child.icon = "binary";
        }

        SystemTags[childId] = {
            id: childId,
            name: childName,
            icon: child.icon,
            description: child.description,
            parent: id,
        } as Tag;
    }
});