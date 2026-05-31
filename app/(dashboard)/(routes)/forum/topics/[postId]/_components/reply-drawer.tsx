"use client";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { MessageCircle } from "lucide-react";
import { CreateReplyForm } from "./create-reply-form";
import { useLocale } from "@/lib/i18n";

interface ReplyDrawerProps {
  postId: string;
}

export function ReplyDrawer({ postId }: ReplyDrawerProps) {
  const { t } = useLocale();

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg"
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-2xl">
          <DrawerHeader className="border-b pb-4">
            <DrawerTitle>{t.forum.writeAReply}</DrawerTitle>
          </DrawerHeader>
          <div className="p-4">
            <CreateReplyForm postId={postId} />
          </div>
          <div className="mt-4 flex items-center justify-end gap-x-2 border-t p-4">
            <DrawerClose asChild>
              <Button variant="outline">{t.common.cancel}</Button>
            </DrawerClose>
            <Button type="submit" form="reply-form">
              {t.forum.publish}
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
