import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslation } from 'react-i18next';
import { Heart, Coffee, Server } from "lucide-react";

export function SupportProject() {
  const { t } = useTranslation('common');
  
  const handleBuyMeCoffee = () => {
    window.open('https://coff.ee/maximelngl1', '_blank');
  };

  return (
    <Card className={cn("p-4 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50")}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-amber-800">
          <Heart className="w-5 h-5 text-red-500" />
          {t('SupportProject.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-gray-600">
          <p className="mb-2">
            {t('SupportProject.description')}
          </p>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Server className="w-4 h-4" />
            <span>{t('SupportProject.hostingCosts')}</span>
          </div>
        </div>
        
        <Button 
          onClick={handleBuyMeCoffee}
          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
        >
          <Coffee className="w-4 h-4 mr-2" />
          {t('SupportProject.buyMeCoffee')}
        </Button>
        
        <div className="text-center">
          <p className="text-xs text-gray-500">
            {t('SupportProject.thankYou')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
