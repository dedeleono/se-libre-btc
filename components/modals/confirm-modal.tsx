"use client"

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger
} from "@/components/ui/alert-dialog"
import { useLocale } from "@/lib/i18n";

interface ConfirmModalProps {
    children: React.ReactNode;
    onConfirm: ()=> void
}

export const ConfirmModal = ({children, onConfirm}: ConfirmModalProps) => {
    const { t } = useLocale();

    return(
        <AlertDialog>
            <AlertDialogTrigger asChild>
                {children}
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{t.common.confirmTitle}</AlertDialogTitle>
                    <AlertDialogDescription>{t.forms.confirmDeleteDescription}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
                    <AlertDialogAction onClick={onConfirm}>{t.common.continue}</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
