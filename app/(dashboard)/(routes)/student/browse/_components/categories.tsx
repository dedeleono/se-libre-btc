"use client"

import { Category } from "@prisma/client"
import { IconType } from "react-icons"
import { FcEngineering, FcFilmReel, FcMusic, FcMultipleDevices, FcSportsMode, FcOldTimeCamera, FcSalesPerformance } from 'react-icons/fc'
import { SiHiveBlockchain } from "react-icons/si";
import { CategoryItem } from "./category-item";

interface CategoriesProps {
    items: Category[]
}

const iconMap: Record<Category["name"], IconType> = {
    "Music": FcMusic,
    "Photography": FcOldTimeCamera,
    "Sales": FcSalesPerformance,
    "Engineering": FcEngineering,
    "Film & Animation": FcFilmReel,
    "Marketing": FcMultipleDevices,
    "Sports": FcSportsMode,
    "Blockchain": SiHiveBlockchain,
    "Web3": SiHiveBlockchain,
}

export const Categories = ({items}: CategoriesProps) => {
    return (
        <div className="flex items-center gap-x-2 overflow-x-auto pb-2">
            {items.map((item) => (
                <CategoryItem
                    key={item.id}
                    label={item.name}
                    icon={iconMap[item.name]}
                    value={item.id}
                />
            ))}
        </div>
    )
}