"use client";

/**
 * /marka — etkileşimli bileşen örnekleri.
 * Base UI `render` kompozisyonu istemci tarafında kalmalı; bu yüzden
 * diyalog/menü/tooltip/toast örnekleri tek bir istemci dosyasında.
 */

import {
  BellIcon,
  ChevronDownIcon,
  InfoIcon,
  LogOutIcon,
  MenuIcon,
  PlusIcon,
  SettingsIcon,
  UserIcon,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const EXAMS = [
  { value: "lgs", label: "LGS" },
  { value: "yks", label: "YKS" },
  { value: "kpss", label: "KPSS" },
];

export function SelectDemo() {
  return (
    <Select items={EXAMS} defaultValue="yks">
      <SelectTrigger className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {EXAMS.map((exam) => (
          <SelectItem key={exam.value} value={exam.value}>
            {exam.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function TabsDemo() {
  return (
    <Tabs defaultValue="denemeler">
      <TabsList className="w-full">
        <TabsTrigger value="genel">Genel Bakış</TabsTrigger>
        <TabsTrigger value="denemeler">Denemeler</TabsTrigger>
        <TabsTrigger value="program">Program</TabsTrigger>
      </TabsList>
      <TabsContent value="genel" className="text-muted-foreground">
        Haftalık özet ve hedefler burada görünecek.
      </TabsContent>
      <TabsContent value="denemeler" className="text-muted-foreground">
        Son denemelerin net dökümü burada listelenecek.
      </TabsContent>
      <TabsContent value="program" className="text-muted-foreground">
        Koçunun hazırladığı haftalık çalışma programı.
      </TabsContent>
    </Tabs>
  );
}

export function DialogDemo() {
  return (
    <Dialog>
      <DialogTrigger render={<Button />}>
        <PlusIcon data-icon="inline-start" />
        Deneme ekle
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Yeni deneme</DialogTitle>
          <DialogDescription>
            TYT Deneme 13 için doğru ve yanlış sayılarını gir; netini biz
            hesaplayalım.
          </DialogDescription>
        </DialogHeader>
        <Field>
          <FieldLabel htmlFor="deneme-adi">Deneme adı</FieldLabel>
          <Input id="deneme-adi" placeholder="Örn. 3D TYT Deneme 13" />
        </Field>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            Vazgeç
          </DialogClose>
          <Button>Kaydet</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function SheetDemo() {
  return (
    <Sheet>
      <SheetTrigger render={<Button variant="outline" />}>
        <MenuIcon data-icon="inline-start" />
        Menü
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Menü</SheetTitle>
          <SheetDescription>
            Mobil gezinme bu panelden açılacak.
          </SheetDescription>
        </SheetHeader>
        <nav className="flex flex-col gap-1 px-4 text-sm">
          {["Panelim", "Denemelerim", "Programım", "Koçum"].map((item) => (
            <span
              key={item}
              className="rounded-lg px-3 py-2 font-medium hover:bg-muted"
            >
              {item}
            </span>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}

export function DropdownDemo() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" />}>
        Hesabım
        <ChevronDownIcon data-icon="inline-end" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>ahmet@dereceninruhu.com</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <UserIcon />
          Profilim
        </DropdownMenuItem>
        <DropdownMenuItem>
          <SettingsIcon />
          Ayarlar
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">
          <LogOutIcon />
          Çıkış yap
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function TooltipDemo() {
  return (
    <Tooltip>
      <TooltipTrigger render={<Button variant="ghost" size="icon" aria-label="Net nedir?" />}>
        <InfoIcon />
      </TooltipTrigger>
      <TooltipContent>Net = doğru − yanlış ÷ 4 (YKS/KPSS)</TooltipContent>
    </Tooltip>
  );
}

export function ToastDemo() {
  return (
    <Button
      variant="outline"
      onClick={() =>
        toast.success("Deneme kaydedildi", {
          description: "TYT Deneme 12 — Toplam net 48,75 (+3,75)",
        })
      }
    >
      <BellIcon data-icon="inline-start" />
      Bildirim göster
    </Button>
  );
}
