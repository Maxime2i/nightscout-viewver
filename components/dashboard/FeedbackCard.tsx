import React, { useState } from "react";
import emailjs from "@emailjs/browser";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useTranslation } from 'react-i18next';

export const FeedbackCard = () => {
  const { t } = useTranslation('common');
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError("");
    setSent(false);
    try {
      await emailjs.send(
        "service_qi232lp", // Remplace par ton Service ID
        "template_xxumsb2", // Remplace par ton Template ID
        {
          name: "Spark",
          message,
          email: localStorage.getItem("nightscoutUrl") + " - " + localStorage.getItem("nightscoutToken"),
          to_email: "maxime.lngls21@gmail.com",
        },
        "vshQR0Skfyp2npNDM" // Remplace par ton User ID (public key)
      );
      setSent(true);
      setMessage("");
    } catch (err) {
      setError(t('FeedbackCard.errorMessage'));
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('FeedbackCard.title')}</CardTitle>
      </CardHeader>
      <form onSubmit={handleSend}>
        <CardContent className="space-y-4">
          <Textarea
            placeholder={t('FeedbackCard.placeholder')}
            value={message}
            onChange={e => setMessage(e.target.value)}
            required
            className="resize-none"
          />
          {sent && <p className="text-green-600 text-sm">{t('FeedbackCard.successMessage')}</p>}
          {error && <p className="text-red-600 text-sm">{error}</p>}
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-end pt-4 gap-2">
          <Button type="submit" disabled={sending || !message.trim()} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 w-full sm:w-auto">
            {sending ? t('FeedbackCard.sending') : t('FeedbackCard.send')}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}; 