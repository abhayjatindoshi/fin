import { AppWindowIcon, ArmchairIcon, ArrowLeftRightIcon, BackpackIcon, BadgeIndianRupeeIcon, BananaIcon, BanknoteArrowDownIcon, BanknoteArrowUpIcon, BedIcon, BeerIcon, BicepsFlexedIcon, BitcoinIcon, BookHeartIcon, BrickWallShieldIcon, BrushCleaningIcon, BuildingIcon, BusIcon, CableIcon, CalendarDaysIcon, CalendarIcon, CalendarSyncIcon, CameraIcon, CarFrontIcon, CarIcon, CarrotIcon, CarTaxiFrontIcon, ChartCandlestickIcon, ChefHatIcon, CigaretteIcon, CircleDollarSignIcon, CircleDotDashedIcon, CircleParkingIcon, ClapperboardIcon, CoffeeIcon, CoinsIcon, ConstructionIcon, CookieIcon, CornerDownLeftIcon, CreditCardIcon, CroissantIcon, CrossIcon, DiamondPercentIcon, DropletIcon, DrumstickIcon, DumbbellIcon, EyeClosedIcon, FlameIcon, FootprintsIcon, FuelIcon, Gamepad2Icon, GemIcon, GiftIcon, GlassesIcon, GlassWaterIcon, GraduationCapIcon, GrapeIcon, HamburgerIcon, HammerIcon, HandCoinsIcon, HandHelpingIcon, HandPlatterIcon, HandshakeIcon, HeartHandshakeIcon, HeartIcon, HeartPlusIcon, HospitalIcon, HouseHeartIcon, HouseIcon, IceCreamBowlIcon, LandmarkIcon, LaptopIcon, LibraryBigIcon, MicIcon, MilkIcon, MonitorPlayIcon, MotorbikeIcon, NewspaperIcon, PackageIcon, PaintRollerIcon, PaletteIcon, PartyPopperIcon, PawPrintIcon, PencilRulerIcon, PiggyBankIcon, PillBottleIcon, PillIcon, PizzaIcon, PlaneIcon, PrinterIcon, ReceiptIndianRupeeIcon, ReceiptTextIcon, RoseIcon, RotateCcwIcon, SaladIcon, SatelliteDishIcon, ScaleIcon, ScissorsIcon, ShieldUserIcon, ShirtIcon, ShoppingBagIcon, SofaIcon, SoupIcon, SparklesIcon, SproutIcon, StethoscopeIcon, SyringeIcon, TabletSmartphoneIcon, TentIcon, TentTreeIcon, TicketsIcon, ToyBrickIcon, TrainFrontIcon, TrainTrackIcon, TrendingUpDownIcon, TruckIcon, UserIcon, UtensilsIcon, VaultIcon, WalletIcon, WandSparklesIcon, WashingMachineIcon, WheatIcon, WifiIcon, WrenchIcon, ZapIcon } from 'lucide-react';
import { memo } from 'react';
import { siAirbnb, siApple, siGoogle, siGooglepay, siNetflix, siPaytm, siPhonepe, siSpotify, siSwiggy, siUber, siYoutube, siZomato, type SimpleIcon } from 'simple-icons';
import Amazon from './icons/amazon.svg?react';
import Auto from './icons/auto.svg?react';
import Bowling from './icons/bowling.svg?react';
import Bumble from './icons/bumble.svg?react';
import Fastag from './icons/fastag.svg?react';
import Gas from './icons/gas.svg?react';
import Goldbar from './icons/goldbar.svg?react';
import Lazypay from './icons/lazypay.svg?react';
import Nps from './icons/nps.svg?react';
import Ppf from './icons/ppf.svg?react';
import Rapido from './icons/rapido.svg?react';
import Simpl from './icons/simpl.svg?react';
import Slice from './icons/slice.svg?react';
import Tiffin from './icons/tiffin.svg?react';
import Upi from './icons/upi.svg?react';
import Whistle from './icons/whistle.svg?react';
import Zepto from './icons/zepto.svg?react';

const createSimpleIcon = (icon: SimpleIcon) => {
    const IconComponent: React.FC<React.SVGProps<SVGSVGElement>> = memo(({ ...props }) => {
        return (
            <svg
                role="img"
                viewBox="0 0 24 24" // simple-icons consistently use a 24x24 viewBox
                width={24}
                height={24}
                // fill={`#${icon.hex}`} // Use the icon's primary color
                fill="currentColor"
                aria-label={icon.title} // Accessibility title
                {...props} // Spread standard SVG props (className, onClick, etc.)
            >
                <title>{icon.title}</title>
                <path d={icon.path} />
            </svg>
        );
    });

    IconComponent.displayName = `${icon.title}Icon`;
    return IconComponent;
}

const TagIcons: Record<string, React.FC<React.SVGProps<SVGSVGElement>>> = {

    // Simple Icons - brand logos
    "airbnb": createSimpleIcon(siAirbnb),
    "apple": createSimpleIcon(siApple),
    "google": createSimpleIcon(siGoogle),
    "googlepay": createSimpleIcon(siGooglepay),
    "netflix": createSimpleIcon(siNetflix),
    "paytm": createSimpleIcon(siPaytm),
    "phonepe": createSimpleIcon(siPhonepe),
    "spotify": createSimpleIcon(siSpotify),
    "swiggy": createSimpleIcon(siSwiggy),
    "uber": createSimpleIcon(siUber),
    "youtube": createSimpleIcon(siYoutube),
    "zomato": createSimpleIcon(siZomato),

    // Custom brand icons
    "amazon": Amazon,
    "bumble": Bumble,
    "fastag": Fastag,
    "lazypay": Lazypay,
    "nps": Nps,
    "ppf": Ppf,
    "rapido": Rapido,
    "simpl": Simpl,
    "slice": Slice,
    "upi": Upi,
    "zepto": Zepto,

    // Custom lucide style icons
    "auto": Auto,
    "bowling": Bowling,
    "gas": Gas,
    "goldbar": Goldbar,
    "tiffin": Tiffin,
    "whistle": Whistle,

    "app-window": AppWindowIcon,
    "armchair": ArmchairIcon,
    "arrow-left-right": ArrowLeftRightIcon,
    "backpack": BackpackIcon,
    "badge-indian-rupee": BadgeIndianRupeeIcon,
    "banana": BananaIcon,
    "banknote-arrow-down": BanknoteArrowDownIcon,
    "banknote-arrow-up": BanknoteArrowUpIcon,
    "bed": BedIcon,
    "beer": BeerIcon,
    "biceps-flexed": BicepsFlexedIcon,
    "bitcoin": BitcoinIcon,
    "book-heart": BookHeartIcon,
    "brick-wall-shield": BrickWallShieldIcon,
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
    "drumstick": DrumstickIcon,
    "dumbbell": DumbbellIcon,
    "droplet": DropletIcon,
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
    "hammer": HammerIcon,
    "hand-coins": HandCoinsIcon,
    "hamburger": HamburgerIcon,
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
    "party-popper": PartyPopperIcon,
    "paw-print": PawPrintIcon,
    "pencil-ruler": PencilRulerIcon,
    "piggy-bank": PiggyBankIcon,
    "pill-bottle": PillBottleIcon,
    "pill": PillIcon,
    "pizza": PizzaIcon,
    "plane": PlaneIcon,
    "printer": PrinterIcon,
    "palette": PaletteIcon,
    "receipt-indian-rupee": ReceiptIndianRupeeIcon,
    "receipt-text": ReceiptTextIcon,
    "rose": RoseIcon,
    "rotate-ccw": RotateCcwIcon,
    "salad": SaladIcon,
    "satellite-dish": SatelliteDishIcon,
    "scale": ScaleIcon,
    "scissors": ScissorsIcon,
    "shield-user": ShieldUserIcon,
    "shirt": ShirtIcon,
    "shopping-bag": ShoppingBagIcon,
    "sofa": SofaIcon,
    "soup": SoupIcon,
    "sparkles": SparklesIcon,
    "sprout": SproutIcon,
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
    "user": UserIcon,
    "vault": VaultIcon,
    "utensils": UtensilsIcon,
    "wallet": WalletIcon,
    "wand-sparkles": WandSparklesIcon,
    "washing-machine": WashingMachineIcon,
    "wheat": WheatIcon,
    "wifi": WifiIcon,
    "wrench": WrenchIcon,
    "zap": ZapIcon,
};

export default TagIcons;