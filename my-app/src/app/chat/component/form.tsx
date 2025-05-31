"use client";

// import { UserPreferencesSchema } from "@/app/types/zodTypes/userPreferences";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PromptSettingsSchema } from "@/app/types/schemas";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Textarea } from "@/components/ui/textarea";
import { useUserStore } from "@/app/hooks/StoreHooks/UserStore";
import { useSendForm } from "@/app/api/Queries/useSendForm";
import { useEffect } from "react";
import { useGetForm } from "@/app/api/Queries/useGetForm";
import { AlertDialog, AlertDialogContent, AlertDialogAction, AlertDialogCancel, AlertDialogTitle, AlertDialogDescription, AlertDialogTrigger, Aler, AlertDialogOverlay } from "@radix-ui/react-alert-dialog";
import { AlertDialogFooter, AlertDialogHeader } from "@/components/ui/alert-dialog";



export const PromptSettingForm = () => {
    const { userId } = useUserStore();
    const { mutate: sendForm,isPending: isPending, isError: isError, error: error } = useSendForm();
    const { data: promptSettings, isLoading: isFetching, error: fetchError } = useGetForm(userId);

    const form = useForm<z.infer<typeof PromptSettingsSchema>>({
        resolver: zodResolver(PromptSettingsSchema),
        defaultValues: {
            user_id: "",
            display_name: "",
            occupation: "",
            interests: "",
            custom_prompt: "",
            about_me: "",
        },
    });
    const onSubmit = (data: z.infer<typeof PromptSettingsSchema>) => {
        console.log(data);
        sendForm(data);
      }
      useEffect(() => {
        if (userId) {
          form.reset({
            ...promptSettings,
            user_id: userId,
          })
        }
        console.log("Prompt settings:", promptSettings);
      }, [userId, form, promptSettings]);



      return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit, (err) => console.log("Form errors:", err))} className="space-y-8">
                <FormField 
                    control={form.control}
                    name="display_name"
                    render={({ field } ) => (
                        <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                                <Input {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="occupation"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Ocupation</FormLabel>
                            <FormControl>
                                <Input {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="interests"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Interests</FormLabel>
                            <FormControl>
                                <Input {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField 
                    control={form.control}
                    name="custom_prompt"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Custom Prompt</FormLabel>
                            <FormControl>
                                <Textarea className="resize-none" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="about_me"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>What do you want us to know about the you</FormLabel>
                            <FormControl>
                                <Textarea className="resize-none" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />


                <AlertDialog>
                    <AlertDialogTrigger>
                        send
                    </AlertDialogTrigger>
                    <AlertDialogOverlay>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure you want to submit?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will update your prompt settings.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => form.handleSubmit(onSubmit, (err) => console.log("Form errors:", err))()}>Submit</AlertDialogAction>
                        </AlertDialogFooter>
                </AlertDialogContent>
                </AlertDialogOverlay>

                </AlertDialog>
                {/*TODO: add warn before submitting*/}
                {isError && <p className="text-red-500 p-4 border bg-red-200 border-red-500 rounded-md">Error: {error.message}</p>}
                {isPending && <p className="text-blue-500 p-4 border bg-blue-200 border-blue-500 rounded-md">Submitting...</p>}

            </form>
        </Form>
      )
    
}
