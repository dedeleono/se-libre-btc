import { LucideIcon } from "lucide-react";

export interface PersonalInfo {
    name: string;
    email: string;
    phone: string;
    dpi: string;
}

export interface LevelSelection {
    levelId: string;
    levelName: string;
    price: number;
    inscriptionPrice: number | null;
    inscriptionPaid: boolean;
}

export interface PaymentInfo {
    paymentIntentId: string;
}

export interface CheckoutFormData {
    personalInfo: PersonalInfo;
    levelSelection: LevelSelection;
    payment: PaymentInfo;
}

export interface CheckoutStep {
    id: string;
    label: string;
    icon: LucideIcon;
    description: string;
}