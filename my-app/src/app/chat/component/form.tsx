"use client";

// import { UserPreferencesSchema } from "@/app/types/zodTypes/userPreferences";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Textarea } from "@/components/ui/textarea";
import { useUserStore } from "@/app/hooks/StoreHooks/UserStore";
import { useSendForm } from "@/app/api/Queries/useSendForm";


export const UserPreferencesForm = () => {
    const { userId} = useUserStore();
    const { mutate: sendForm, isPending: isPending, isError: isError, error: error } = useSendForm();

    const form = useForm<z.infer<typeof UserPreferencesSchema>>({
        resolver: zodResolver(UserPreferencesSchema),
        defaultValues: {
            user_id: userId || "",
            username: "",
            occupation: "",
            interests: "",
            custom_prompt: "",
            user_info: "",
        },
    });
    const onSubmit = (data: z.infer<typeof UserPreferencesSchema>) => {
        console.log(data);
        sendForm(data);
      }
      return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField 
                    control={form.control}
                    name="username"
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
                    name="user_info"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>What do you want to know about the you</FormLabel>
                            <FormControl>
                                <Textarea className="resize-none" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button type="submit" disabled={isPending}>Submit</Button>
                {isError && <p className="text-red-500 p-4 border bg-red-200 border-red-500 rounded-md">Error: {error.message}</p>}
                {isPending && <p className="text-blue-500 p-4 border bg-blue-200 border-blue-500 rounded-md">Submitting...</p>}

            </form>
        </Form>
      )
    
}
