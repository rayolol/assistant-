"use client";

import { useTheme } from 'next-themes';
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription, DialogHeader } from '@/components/ui/dialog';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Settings } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { PromptSettingForm } from './form';

const SettingDialog = () => {
    const { theme, setTheme } = useTheme();

    return (
        <Dialog>
          <DialogTrigger>
            <Settings className='w-6 h-6 text-sidebar-accent hover:text-sidebar-accent-foreground'/>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Settings</DialogTitle>
              <hr></hr>
              <DialogDescription>
               
                <div className='flex flex-col gap-2'>
                  <div className='flex items-center gap-2'>
                    <Accordion type='single' collapsible>
                      <AccordionItem value='theme'>
                        <AccordionTrigger>Theme</AccordionTrigger>
                        <AccordionContent>
                          <div className='flex items-center gap-2'>
                            <Switch id='theme' defaultChecked={theme === 'dark'} onCheckedChange={(checked) => { setTheme (checked ? 'dark' : 'light'); }} />
                            <Label htmlFor='theme'>Dark Mode</Label>
                          </div>                        
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                  <hr></hr>
                  <div>
                    <PromptSettingForm/>
                  </div>
                </div>
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
    )
}

export default SettingDialog;
