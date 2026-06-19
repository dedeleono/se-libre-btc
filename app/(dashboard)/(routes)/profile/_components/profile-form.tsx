"use client";

import * as z from "zod";
import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useState } from "react";
import { User, Phone, Upload, Trash } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession, updateUser } from "@/lib/auth-client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { S3FileUpload } from "@/components/file-upload";
import { cn } from "@/lib/utils";
import { UserRole } from "@prisma/client";
import { useLocale } from "@/lib/i18n";
import { AgeRangeSelect } from "@/components/forms/age-range-select";
import Combobox from "@/components/ui/combobox";
import { COUNTRIES, getRegionsForCountry, countryHasRegions } from "@/lib/constants/countries";

interface ProfileFormProps {
  initialData: {
    name: string | null;
    phone?: string | null;
    image?: string | null;
    email?: string;
    role?: UserRole;
    ageRange?: string | null;
    country?: string | null;
    region?: string | null;
  };
}

export default function ProfileForm({ initialData }: ProfileFormProps) {
  const { t } = useLocale();
  const [imageUrl, setImageUrl] = useState<string | null>(initialData.image || null);
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();
  const { refetch } = useSession();
  const formSchema = z.object({
    name: z.string().min(1, {
      message: t.validation.nameRequired,
    }),
    phone: z.string().optional(),
    ageRange: z.string().optional(),
    country: z.string().optional(),
    region: z.string().optional(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData.name || "",
      phone: initialData.phone || "",
      ageRange: initialData.ageRange || "",
      country: initialData.country || "",
      region: initialData.region || "",
    },
  });

  const { isSubmitting } = form.formState;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await axios.patch("/api/users/me", {
        ...values,
        imageUrl,
      });
      
      await updateUser({ name: values.name, image: imageUrl });
      await refetch();

      toast.success(t.profile.updated);
      router.refresh();
    } catch {
      toast.error(t.common.somethingWentWrong);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Profile Image Section */}
        <div className="mt-4 flex flex-col items-center gap-4">
          {imageUrl ? (
            <div className="group relative h-40 w-40">
              <Image
                src={imageUrl}
                alt={t.profile.imageAlt}
                fill
                className="rounded-full object-cover ring-2 ring-border transition-all duration-300 group-hover:ring-primary"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute -right-2 -top-2 z-10 h-7 w-7 rounded-full opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
                onClick={() => setImageUrl(null)}
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <>
              <S3FileUpload
                onUploadComplete={(url) => {
                  setImageUrl(url);
                  toast.success(t.profile.imageUploaded);
                  setIsUploading(false);
                }}
                onUploadError={() => {
                  toast.error(t.profile.uploadFailed);
                  setIsUploading(false);
                }}
                type="image"
                variant="profile"
                acceptedFileTypes={['image/*']}
              />
              <div className="text-xs text-muted-foreground">
                {t.profile.recommendedImage}
              </div>
            </>
          )}
        </div>

        {/* Form Fields */}
        <div className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>{t.profile.fullName}</span>
                </FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    className={cn(
                      "transition-all duration-300 focus:scale-[1.002]",
                      "bg-background"
                    )}
                    placeholder={t.profile.fullNamePlaceholder}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center space-x-2">
                  <Phone className="h-4 w-4" />
                  <span>{t.profile.phone}</span>
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    className={cn(
                      "transition-all duration-300 focus:scale-[1.002]",
                      "bg-background"
                    )}
                    placeholder={t.profile.phonePlaceholder}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="ageRange"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.profile.ageRange}</FormLabel>
                <FormControl>
                  <AgeRangeSelect
                    value={field.value}
                    onChange={field.onChange}
                    placeholder={t.profile.ageRangePlaceholder}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t.profile.country}</FormLabel>
                <FormControl>
                  <Combobox
                    options={COUNTRIES.map((c) => ({ label: c.name, value: c.name }))}
                    value={field.value}
                    onChange={(v) => {
                      form.setValue("country", v as string);
                      form.setValue("region", "");
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {countryHasRegions(form.watch("country") ?? "") && (
            <FormField
              control={form.control}
              name="region"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.profile.region}</FormLabel>
                  <FormControl>
                    <Combobox
                      options={getRegionsForCountry(form.watch("country") ?? "").map((r) => ({
                        label: r,
                        value: r,
                      }))}
                      value={field.value}
                      onChange={(v) => form.setValue("region", v as string)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        {/* Submit Button */}
        <Button
          disabled={isSubmitting || isUploading}
          type="submit"
          className={cn(
            "w-full transition-all duration-300",
            "hover:shadow-md hover:scale-[1.002]",
            "flex items-center justify-center space-x-2"
          )}
          size="lg"
        >
          {isSubmitting ? (
            <div className="flex items-center space-x-2">
              <Upload className="h-4 w-4 animate-spin" />
              <span>{t.profile.saving}</span>
            </div>
          ) : (
            <span>{t.profile.saveChanges}</span>
          )}
        </Button>
      </form>
    </Form>
  );
} 
