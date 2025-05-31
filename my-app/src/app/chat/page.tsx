"use client";
import { useTheme } from 'next-themes';
import ChatWindow from './component/ChatWindow';
import SideBar from './component/SideBar';
import { ContentContainer } from '@/components/ui/container';
import { Sidebar, SidebarContent, SidebarTrigger } from '@/components/ui/sidebar';
import ChatInput from './component/ChatInput';
import { useMessageHandling } from '../hooks/useMessageHandling';
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription, DialogHeader, DialogFooter } from '@/components/ui/dialog';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Settings } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useEffect, useState } from 'react';
import { PromptSettingForm } from './component/form';
//import { UserPreferencesForm } from './component/form';

const ChatPage = () => {
  const { isStreaming, sendMessage } = useMessageHandling();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  },[])

 

  if (!mounted) return null;

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-y-hidden">

        <Sidebar>
          <SidebarContent>
            <SidebarTrigger />
            <SideBar />
          </SidebarContent>
        </Sidebar>

      <ContentContainer fluid={true} className='flex flex-col min-w-0 items-center'>
        {/* Header */}
        <header className="w-full bg-white dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-500 py-4 px-6 flex items-center justify-between">
          <SidebarTrigger/>
          <h1 className="text-lg font-bold text-gray-800 dark:text-white">Memory Chat</h1>
        </header>

        {/* Main content */}
        <main className="flex flex-col flex-1 h-full overflow-y-auto">
           <ChatWindow />
        </main>

       {/* Message input area */}
       <footer className="w-full px-2 sm:px-4 sm:pb-4 pt-2">
          <ChatInput isStreaming={isStreaming} sendMessage={sendMessage}/>
        </footer>

        
      </ContentContainer>


       {/* right Sidebar */}
       <aside className="pt-2 w-20 flex flex-col items-center border-1 border-sidebar-border bg-sidebar">
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
                            <Switch id='theme' onCheckedChange={(checked) => { setTheme (checked ? 'dark' : 'light'); }} />
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
       </aside>
    </div>
  );
}

export default ChatPage;
