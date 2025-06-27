import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Droplet, FileText } from "lucide-react";
import { useTranslation } from 'react-i18next';

export function QuickActions() {
  const { t } = useTranslation('common');

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('QuickActions.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button variant="outline" className="w-full justify-start gap-2">
          <Plus className="h-4 w-4" /> {t('QuickActions.addGlucoseReading')}
        </Button>
        <Button variant="outline" className="w-full justify-start gap-2">
          <Droplet className="h-4 w-4" /> {t('QuickActions.logInsulinDose')}
        </Button>
        <Button variant="outline" className="w-full justify-start gap-2">
          <FileText className="h-4 w-4" /> {t('QuickActions.addNote')}
        </Button>
      </CardContent>
    </Card>
  );
} 