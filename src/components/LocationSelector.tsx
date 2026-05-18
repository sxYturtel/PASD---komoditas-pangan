import { MapPin } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

interface LocationSelectorProps {
  selectedProvince: string;
  onProvinceChange: (province: string) => void;
  availableProvinces: string[]; // Menggunakan array provinsi dinamis dari Excel
}

export function LocationSelector({ selectedProvince, onProvinceChange, availableProvinces }: LocationSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <MapPin className="w-5 h-5 text-green-100" />
      <Select value={selectedProvince} onValueChange={onProvinceChange}>
        <SelectTrigger className="bg-green-500 border-green-400 text-white hover:bg-green-600 w-[220px]">
          <SelectValue placeholder="Pilih Provinsi" />
        </SelectTrigger>
        <SelectContent>
          {availableProvinces.map((prov) => (
            <SelectItem key={prov} value={prov}>
              {prov}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
