import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { useTranslation } from 'react-i18next';

export function ShareLinks() {
  const { t } = useTranslation('common');
  const url = localStorage.getItem("nightscoutUrl");
  const token = localStorage.getItem("nightscoutToken");
  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/?nightscoutUrl=${url}&nightscoutToken=${token}`;

  return (
    <Card className={cn("p-4")}>
      <CardHeader>
        <CardTitle>{t('ShareLinks.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-2">
          {t('ShareLinks.description')}
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            type="text"
            value={shareUrl}
            className="form-input block w-full border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            disabled
          />
          <Button
            onClick={() => navigator.clipboard.writeText(shareUrl)}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 w-full sm:w-auto"
          >
            {t('ShareLinks.copyLink')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
