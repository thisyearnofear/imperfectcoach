
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HeightUnit } from "@/lib/types";
import { getUnitLabel } from "@/lib/heightConversion";

interface HeightUnitSelectorProps {
  value: HeightUnit;
  onValueChange: (unit: HeightUnit) => void;
  className?: string;
}

const HeightUnitSelector = ({ value, onValueChange, className }: HeightUnitSelectorProps) => {
  const units: HeightUnit[] = ['cm', 'inches', 'feet', 'meters'];

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder="Select height unit" />
      </SelectTrigger>
      <SelectContent className="bg-background border border-border">
        {units.map((unit) => (
          <SelectItem key={unit} value={unit}>
            {getUnitLabel(unit)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default HeightUnitSelector;
