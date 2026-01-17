import { AppWindowIcon, ArmchairIcon, ArrowLeftRightIcon, BackpackIcon, BadgeIndianRupeeIcon, BadgeQuestionMarkIcon, BananaIcon, BanknoteArrowDownIcon, BanknoteArrowUpIcon, BatteryChargingIcon, BedIcon, BeerIcon, BicepsFlexedIcon, BikeIcon, BitcoinIcon, BookHeartIcon, BookmarkXIcon, BrickWallShieldIcon, BriefcaseBusinessIcon, BrushCleaningIcon, BuildingIcon, BusIcon, CableIcon, CalendarDaysIcon, CalendarIcon, CalendarSyncIcon, CameraIcon, CarFrontIcon, CarIcon, CarrotIcon, CarTaxiFrontIcon, ChartCandlestickIcon, ChefHatIcon, CigaretteIcon, CircleDollarSignIcon, CircleDotDashedIcon, CircleParkingIcon, ClapperboardIcon, CoffeeIcon, CoinsIcon, ConstructionIcon, CookieIcon, CornerDownLeftIcon, CreditCardIcon, CroissantIcon, CrossIcon, DiamondPercentIcon, DropletIcon, DrumstickIcon, DumbbellIcon, EyeClosedIcon, FlameIcon, FootprintsIcon, FuelIcon, Gamepad2Icon, GemIcon, GiftIcon, GlassesIcon, GlassWaterIcon, GraduationCapIcon, GrapeIcon, HamburgerIcon, HammerIcon, HandCoinsIcon, HandHelpingIcon, HandPlatterIcon, HandshakeIcon, HeartHandshakeIcon, HeartIcon, HeartPlusIcon, HospitalIcon, HouseHeartIcon, HouseIcon, IceCreamBowlIcon, IceCreamConeIcon, LampIcon, LandmarkIcon, LaptopIcon, LibraryBigIcon, MicIcon, MilkIcon, MonitorPlayIcon, MotorbikeIcon, NewspaperIcon, PackageIcon, PaintRollerIcon, PaletteIcon, PartyPopperIcon, PawPrintIcon, PencilRulerIcon, PiggyBankIcon, PillBottleIcon, PillIcon, PizzaIcon, PlaneIcon, PrinterIcon, ReceiptIndianRupeeIcon, ReceiptTextIcon, RoseIcon, RotateCcwIcon, SaladIcon, SandwichIcon, SatelliteDishIcon, ScaleIcon, ScissorsIcon, ShieldUserIcon, ShirtIcon, ShoppingBagIcon, ShoppingBasketIcon, ShoppingCartIcon, SofaIcon, SoupIcon, SparklesIcon, SproutIcon, StampIcon, StethoscopeIcon, SyringeIcon, TabletSmartphoneIcon, TentIcon, TentTreeIcon, TicketsIcon, ToyBrickIcon, TrainFrontIcon, TrainTrackIcon, TrendingUpDownIcon, TruckIcon, UserIcon, UsersIcon, UserStarIcon, UtensilsIcon, VaultIcon, WalletIcon, WandSparklesIcon, WashingMachineIcon, WheatIcon, WifiIcon, WineIcon, WrenchIcon, ZapIcon } from 'lucide-react';
import React from 'react';
import { siAirbnb, siApple, siGoogle, siGooglepay, siNetflix, siPaytm, siPhonepe, siSpotify, siSwiggy, siUber, siYoutube, siZomato } from 'simple-icons';
import { createSimpleIcon } from '../helpers';
import { ImportIconComponent } from '../import/ImportIcon';
import AmazonPay from './icons/amazon-pay.svg?react';
import AmazonPrimeVideo from './icons/amazon-prime-video.svg?react';
import { AutoIcon } from './icons/auto';
import Blinkit from './icons/blinkit.svg?react';
import { BowlingIcon } from './icons/bowling';
import { BrownBagIcon } from './icons/brownbag';
import Bumble from './icons/bumble.svg?react';
import Cred from './icons/cred.svg?react';
import CricketIcon from './icons/cricket.svg?react';
import District from './icons/district.svg?react';
import EazyDiner from './icons/eazydiner.svg?react';
import Fastag from './icons/fastag.svg?react';
import FatherIcon from './icons/father.svg?react';
import FootballIcon from './icons/football.svg?react';
import { GasIcon } from './icons/gas';
import { GoldbarIcon } from './icons/goldbar';
import Lazypay from './icons/lazypay.svg?react';
import { MakeupIcon } from './icons/makeup';
import MotherIcon from './icons/mother.svg?react';
import NammaYatri from './icons/namma-yatri.svg?react';
import Nps from './icons/nps.svg?react';
import Ola from './icons/ola.svg?react';
import Ppf from './icons/ppf.svg?react';
import Rapido from './icons/rapido.svg?react';
import { SewingIcon } from './icons/sewing';
import { ShuttlecockIcon } from './icons/shuttlecock';
import Simpl from './icons/simpl.svg?react';
import Slice from './icons/slice.svg?react';
import { TiffinIcon } from './icons/tiffin';
import { ToothIcon } from './icons/tooth';
import Upi from './icons/upi.svg?react';
import { WhistleIcon } from './icons/whistle';
import Zepto from './icons/zepto.svg?react';

type TagIconComponentProps = React.SVGProps<SVGSVGElement> & {
    name: string;
};

export const TagIconComponent: React.FC<TagIconComponentProps> = ({ name, ...props }) => {
    if (name.startsWith('account-')) return <ImportIconComponent name={name.split('account-')[1]} {...props} />;
    let Icon = TagIcons[name];
    if (!Icon) {
        Icon = TagIcons['badge-question-mark'];
        props.className = ((props.className ?? '') + ' text-destructive').trim();

    }
    return Icon ? <Icon {...props} /> : null;
};

const TagIcons: Record<string, React.FC<React.SVGProps<SVGSVGElement>>> = {

    // Simple Icons - brand logos
    "airbnb": createSimpleIcon(siAirbnb, 'currentColor'),
    "apple": createSimpleIcon(siApple, 'currentColor'),
    "google": createSimpleIcon(siGoogle, 'currentColor'),
    "googlepay": createSimpleIcon(siGooglepay, 'currentColor'),
    "netflix": createSimpleIcon(siNetflix, 'currentColor'),
    "paytm": createSimpleIcon(siPaytm, 'currentColor'),
    "phonepe": createSimpleIcon(siPhonepe, 'currentColor'),
    "spotify": createSimpleIcon(siSpotify, 'currentColor'),
    "swiggy": createSimpleIcon(siSwiggy, 'currentColor'),
    "uber": createSimpleIcon(siUber, 'currentColor'),
    "youtube": createSimpleIcon(siYoutube, 'currentColor'),
    "zomato": createSimpleIcon(siZomato, 'currentColor'),

    // Custom brand icons
    "amazon-pay": AmazonPay,
    "amazon-prime-video": AmazonPrimeVideo,
    "blinkit": Blinkit,
    "bumble": Bumble,
    "cred": Cred,
    "district": District,
    "eazydiner": EazyDiner,
    "fastag": Fastag,
    "lazypay": Lazypay,
    "namma-yatri": NammaYatri,
    "nps": Nps,
    "ola": Ola,
    "ppf": Ppf,
    "rapido": Rapido,
    "simpl": Simpl,
    "slice": Slice,
    "upi": Upi,
    "zepto": Zepto,

    // Custom lucide style icons
    "auto": AutoIcon,
    "bowling": BowlingIcon,
    "brownbag": BrownBagIcon,
    "cricket": CricketIcon,
    "football": FootballIcon,
    "gas": GasIcon,
    "goldbar": GoldbarIcon,
    "makeup": MakeupIcon,
    "shuttlecock": ShuttlecockIcon,
    "tiffin": TiffinIcon,
    "tooth": ToothIcon,
    "father": FatherIcon,
    "mother": MotherIcon,
    "whistle": WhistleIcon,

    "app-window": AppWindowIcon,
    "armchair": ArmchairIcon,
    "arrow-left-right": ArrowLeftRightIcon,
    "backpack": BackpackIcon,
    "badge-indian-rupee": BadgeIndianRupeeIcon,
    "badge-question-mark": BadgeQuestionMarkIcon,
    "banana": BananaIcon,
    "banknote-arrow-down": BanknoteArrowDownIcon,
    "banknote-arrow-up": BanknoteArrowUpIcon,
    "battery-charging": BatteryChargingIcon,
    "bed": BedIcon,
    "beer": BeerIcon,
    "biceps-flexed": BicepsFlexedIcon,
    "bike-fast": BikeIcon,
    "bitcoin": BitcoinIcon,
    "book-heart": BookHeartIcon,
    "bookmark-x": BookmarkXIcon,
    "brick-wall-shield": BrickWallShieldIcon,
    "briefcase-business": BriefcaseBusinessIcon,
    "brush-cleaning": BrushCleaningIcon,
    "building": BuildingIcon,
    "bus": BusIcon,
    "cable": CableIcon,
    "calendar-days": CalendarDaysIcon,
    "calendar-sync": CalendarSyncIcon,
    "calendar": CalendarIcon,
    "camera": CameraIcon,
    "car-front": CarFrontIcon,
    "car-taxi-front": CarTaxiFrontIcon,
    "car": CarIcon,
    "carrot": CarrotIcon,
    "chart-candlestick": ChartCandlestickIcon,
    "chef-hat": ChefHatIcon,
    "cigarette": CigaretteIcon,
    "circle-dollar-sign": CircleDollarSignIcon,
    "circle-dot-dashed": CircleDotDashedIcon,
    "circle-parking": CircleParkingIcon,
    "clapperboard": ClapperboardIcon,
    "coffee": CoffeeIcon,
    "coins": CoinsIcon,
    "construction": ConstructionIcon,
    "cookie": CookieIcon,
    "corner-down-left": CornerDownLeftIcon,
    "credit-card": CreditCardIcon,
    "croissant": CroissantIcon,
    "cross": CrossIcon,
    "diamond-percent": DiamondPercentIcon,
    "droplet": DropletIcon,
    "drumstick": DrumstickIcon,
    "dumbbell": DumbbellIcon,
    "eye-closed": EyeClosedIcon,
    "flame": FlameIcon,
    "footprints": FootprintsIcon,
    "fuel": FuelIcon,
    "gamepad-2": Gamepad2Icon,
    "gem": GemIcon,
    "gift": GiftIcon,
    "glass-water": GlassWaterIcon,
    "glasses": GlassesIcon,
    "graduation-cap": GraduationCapIcon,
    "grape": GrapeIcon,
    "hamburger": HamburgerIcon,
    "hammer": HammerIcon,
    "hand-coins": HandCoinsIcon,
    "hand-helping": HandHelpingIcon,
    "hand-platter": HandPlatterIcon,
    "handshake": HandshakeIcon,
    "heart-handshake": HeartHandshakeIcon,
    "heart-plus": HeartPlusIcon,
    "heart": HeartIcon,
    "hospital": HospitalIcon,
    "house-heart": HouseHeartIcon,
    "house": HouseIcon,
    "ice-cream-bowl": IceCreamBowlIcon,
    "ice-cream-cone": IceCreamConeIcon,
    "lamp": LampIcon,
    "landmark": LandmarkIcon,
    "laptop": LaptopIcon,
    "library-big": LibraryBigIcon,
    "mic": MicIcon,
    "milk": MilkIcon,
    "monitor-play": MonitorPlayIcon,
    "motorbike": MotorbikeIcon,
    "newspaper": NewspaperIcon,
    "package": PackageIcon,
    "paint-roller": PaintRollerIcon,
    "palette": PaletteIcon,
    "party-popper": PartyPopperIcon,
    "paw-print": PawPrintIcon,
    "pencil-ruler": PencilRulerIcon,
    "piggy-bank": PiggyBankIcon,
    "pill-bottle": PillBottleIcon,
    "pill": PillIcon,
    "pizza": PizzaIcon,
    "plane": PlaneIcon,
    "printer": PrinterIcon,
    "receipt-indian-rupee": ReceiptIndianRupeeIcon,
    "receipt-text": ReceiptTextIcon,
    "rose": RoseIcon,
    "rotate-ccw": RotateCcwIcon,
    "salad": SaladIcon,
    "sandwich": SandwichIcon,
    "satellite-dish": SatelliteDishIcon,
    "scale": ScaleIcon,
    "scissors": ScissorsIcon,
    "sewing": SewingIcon,
    "shield-user": ShieldUserIcon,
    "shirt": ShirtIcon,
    "shopping-bag": ShoppingBagIcon,
    "shopping-basket": ShoppingBasketIcon,
    "shopping-cart": ShoppingCartIcon,
    "sofa": SofaIcon,
    "soup": SoupIcon,
    "sparkles": SparklesIcon,
    "sprout": SproutIcon,
    "stamp": StampIcon,
    "stethoscope": StethoscopeIcon,
    "syringe": SyringeIcon,
    "tablet-smartphone": TabletSmartphoneIcon,
    "tent-tree": TentTreeIcon,
    "tent": TentIcon,
    "tickets": TicketsIcon,
    "toy-brick": ToyBrickIcon,
    "train-front": TrainFrontIcon,
    "train-track": TrainTrackIcon,
    "trending-up-down": TrendingUpDownIcon,
    "truck": TruckIcon,
    "user-star": UserStarIcon,
    "user": UserIcon,
    "users": UsersIcon,
    "utensils": UtensilsIcon,
    "vault": VaultIcon,
    "wallet": WalletIcon,
    "wand-sparkles": WandSparklesIcon,
    "washing-machine": WashingMachineIcon,
    "wheat": WheatIcon,
    "wifi": WifiIcon,
    "wine": WineIcon,
    "wrench": WrenchIcon,
    "zap": ZapIcon,
};

export default TagIcons;