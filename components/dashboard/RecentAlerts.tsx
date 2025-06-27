import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useTranslation } from 'react-i18next';

export function RecentAlerts() {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('RecentAlerts.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 rounded-lg bg-red-50 border border-red-200">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-red-500"></span>
            <p className="font-semibold">{t('RecentAlerts.highGlucose')}</p>
          </div>
          <p className="text-sm text-gray-600 ml-4">280 mg/dL at 2:30 PM</p>
        </div>
        <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-yellow-500"></span>
            <p className="font-semibold">{t('RecentAlerts.trendingHigh')}</p>
          </div>
          <p className="text-sm text-gray-600 ml-4">{t('RecentAlerts.risingFor')}</p>
        </div>
      </CardContent>
    </Card>
  );
} 