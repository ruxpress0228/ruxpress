import { Link } from "react-router";
import {
  ArrowRight,
  Baby,
  BookOpen,
  Cookie,
  Disc3,
  Footprints,
  HeartPulse,
  Shirt,
  Smartphone,
  Smile,
  Sparkles,
  Tag,
  type LucideIcon,
} from "lucide-react";
import { cn } from "../ui/utils";
import { useTranslation } from "../../hooks/useTranslation";

/** Category names are free text typed by admins, so the icon is picked by keyword. */
const ICON_RULES: { icon: LucideIcon; keywords: string[] }[] = [
  { icon: Sparkles, keywords: ["뷰티", "화장", "코스메", "스킨", "beauty", "cosmet", "skin", "косметик", "красот", "уход"] },
  { icon: Footprints, keywords: ["신발", "슈즈", "스니커", "shoe", "sneaker", "обув", "кроссов"] },
  { icon: Shirt, keywords: ["패션", "의류", "옷", "fashion", "cloth", "apparel", "wear", "одежд", "мода"] },
  { icon: Smartphone, keywords: ["전자", "가전", "디지털", "폰", "electronic", "gadget", "tech", "электрон", "техник", "гаджет"] },
  { icon: Cookie, keywords: ["식품", "음식", "간식", "라면", "food", "snack", "еда", "продукт", "снек"] },
  { icon: Disc3, keywords: ["굿즈", "앨범", "음반", "goods", "album", "merch", "pop", "мерч", "альбом"] },
  { icon: Smile, keywords: ["캐릭터", "인형", "장난감", "toy", "character", "игруш", "персонаж"] },
  { icon: BookOpen, keywords: ["도서", "책", "문구", "book", "stationery", "книг", "канцеляр"] },
  { icon: Baby, keywords: ["유아", "아동", "키즈", "kids", "baby", "дет", "малыш"] },
  { icon: HeartPulse, keywords: ["건강", "비타민", "health", "vitamin", "здоров", "витамин"] },
];

const TINTS = ["bg-tint-peach", "bg-tint-mint", "bg-tint-lilac", "bg-tint-butter", "bg-tint-sky"];

export function categoryIcon(name: string): LucideIcon {
  const lower = name.toLowerCase();
  return ICON_RULES.find((rule) => rule.keywords.some((k) => lower.includes(k)))?.icon ?? Tag;
}

type CategoryTilesProps = {
  categories: string[];
  /** Keep the row to one screen; the rest is reachable from the "all" tile. */
  max?: number;
  className?: string;
};

/** Soft colour tiles, one per category, ending with a black "all products" tile. */
export function CategoryTiles({ categories, max = 11, className }: CategoryTilesProps) {
  const { t } = useTranslation();
  const shown = categories.slice(0, max);
  const tileClass =
    "group flex aspect-square flex-col justify-between rounded-3xl p-4 transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0 md:p-5";
  return (
    <div className={cn("grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6", className)}>
      {shown.map((name, i) => {
        const Icon = categoryIcon(name);
        return (
          <Link
            key={name}
            to={`/products?category=${encodeURIComponent(name)}`}
            className={cn(tileClass, TINTS[i % TINTS.length])}
          >
            <Icon className="size-6 md:size-7" strokeWidth={1.75} aria-hidden />
            <span className="line-clamp-2 text-sm font-semibold leading-snug md:text-base">{name}</span>
          </Link>
        );
      })}
      <Link to="/products" className={cn(tileClass, "bg-foreground text-background")}>
        <ArrowRight
          className="size-6 transition-transform duration-200 group-hover:translate-x-0.5 md:size-7"
          strokeWidth={1.75}
          aria-hidden
        />
        <span className="text-sm font-semibold leading-snug md:text-base">{t("landing.categories.all")}</span>
      </Link>
    </div>
  );
}
