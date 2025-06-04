
"use client";

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useApiKey } from '@/contexts/ApiKeyContext';
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, ShieldAlert } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export function ApiKeyModal({ isOpen, setIsOpen }: ApiKeyModalProps) {
  const { apiKey, setApiKey, isApiKeySet } = useApiKey();
  const [currentKeyValue, setCurrentKeyValue] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (apiKey) {
      setCurrentKeyValue(apiKey);
    } else {
      setCurrentKeyValue('');
    }
  }, [apiKey, isOpen]);

  const handleSave = () => {
    setApiKey(currentKeyValue);
    toast({
      title: "API Key Saved",
      description: "Your Gemini API key has been saved locally.",
      action: <ShieldCheck className="h-5 w-5 text-green-500" />,
    });
    setIsOpen(false);
  };

  const handleRemove = () => {
    setApiKey(null);
    setCurrentKeyValue('');
     toast({
      title: "API Key Removed",
      description: "Your Gemini API key has been removed from local storage.",
      variant: "destructive",
      action: <ShieldAlert className="h-5 w-5 text-yellow-500" />,
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[480px] glass-card">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">Gemini API Key</DialogTitle>
          <DialogDescription>
            Enter your Gemini API key to enable AI-powered features. Your key is stored locally in your browser.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="apiKey" className="text-right">
              API Key
            </Label>
            <Input
              id="apiKey"
              type="password"
              value={currentKeyValue}
              onChange={(e) => setCurrentKeyValue(e.target.value)}
              className="col-span-3"
              placeholder="Enter your Gemini API Key"
            />
          </div>
          {isApiKeySet && (
            <div className="flex items-center space-x-2 text-sm text-green-600 dark:text-green-400 col-span-4 justify-center">
              <ShieldCheck className="h-4 w-4" />
              <span>API Key is set.</span>
            </div>
          )}
        </div>
        <DialogFooter className="gap-2 sm:justify-between">
          {isApiKeySet && (
            <Button type="button" variant="destructive" onClick={handleRemove}>Remove Key</Button>
          )}
          <div className="flex gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" onClick={handleSave} disabled={!currentKeyValue.trim()}>Save Key</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
