import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Specialty } from '@/hooks/useDoctors';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

const formSchema = z.object({
    first_name: z.string().min(2, { message: 'First name must be at least 2 characters' }),
    last_name: z.string().min(2, { message: 'Last name must be at least 2 characters' }),
    phone: z.string().min(10, { message: 'Phone number must be at least 10 characters' }),
    specialty_ids: z.array(z.string()).min(1, { message: 'Please select at least one specialty' }),
});

interface EditDoctorDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    doctor: any;
    specialties: Specialty[];
    onSuccess: () => void;
}

export const EditDoctorDialog = ({
    open,
    onOpenChange,
    doctor,
    specialties,
    onSuccess,
}: EditDoctorDialogProps) => {
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            first_name: '',
            last_name: '',
            phone: '',
            specialty_ids: [],
        },
    });

    useEffect(() => {
        if (doctor && open) {
            const nameParts = (doctor.profiles?.full_name || '').split(' ');
            const firstName = nameParts[0] || '';
            const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

            const specialtyIds = doctor.specialties?.map((s: any) => s.id) || [];

            form.reset({
                first_name: firstName,
                last_name: lastName,
                phone: doctor.profiles?.phone || '',
                specialty_ids: specialtyIds,
            });
        }
    }, [doctor, open, form]);

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setLoading(true);
        try {
            if (!doctor || !doctor.user_id || !doctor.id) {
                throw new Error("Invalid doctor data");
            }

            // 1. Update Profile (first_name, last_name, phone)
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    first_name: values.first_name,
                    last_name: values.last_name,
                    phone: values.phone,
                })
                .eq('id', doctor.user_id);

            if (profileError) throw profileError;

            // 2. Doctor details like years_of_experience are no longer updated here
            // Removing the old update block

            // 3. Update Specialties
            // First delete existing specialties
            const { error: deleteError } = await supabase
                .from('doctor_specialties')
                .delete()
                .eq('doctor_id', doctor.id);

            if (deleteError) throw deleteError;

            // Then insert new specialties
            const specialtiesToInsert = values.specialty_ids.map(specialtyId => ({
                doctor_id: doctor.id,
                specialty_id: specialtyId
            }));

            const { error: junctionError } = await supabase
                .from('doctor_specialties')
                .insert(specialtiesToInsert);

            if (junctionError) throw junctionError;

            toast({
                title: 'Success',
                description: 'Doctor updated successfully',
            });

            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            console.error('Error updating doctor:', error);
            toast({
                title: 'Error updating doctor',
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Doctor</DialogTitle>
                    <DialogDescription>
                        Update doctor's profile, experience, and specialties.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="first_name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>First Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="John" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="last_name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Last Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Doe" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Phone Number</FormLabel>
                                    <FormControl>
                                        <Input placeholder="+1234567890" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="specialty_ids"
                            render={() => (
                                <FormItem>
                                    <div className="mb-4">
                                        <FormLabel>Specialties</FormLabel>
                                        <DialogDescription>
                                            Select all specialties that apply to this doctor.
                                        </DialogDescription>
                                    </div>
                                    <div className="space-y-3">
                                        {specialties.map((item) => (
                                            <FormField
                                                key={item.id}
                                                control={form.control}
                                                name="specialty_ids"
                                                render={({ field }) => {
                                                    return (
                                                        <FormItem
                                                            key={item.id}
                                                            className="flex flex-row items-center space-x-3 space-y-0"
                                                        >
                                                            <FormControl>
                                                                <Checkbox
                                                                    checked={field.value?.includes(item.id)}
                                                                    onCheckedChange={(checked) => {
                                                                        return checked
                                                                            ? field.onChange([...field.value, item.id])
                                                                            : field.onChange(
                                                                                field.value?.filter(
                                                                                    (value) => value !== item.id
                                                                                )
                                                                            );
                                                                    }}
                                                                />
                                                            </FormControl>
                                                            <FormLabel className="font-normal cursor-pointer text-sm">
                                                                {item.name}
                                                            </FormLabel>
                                                        </FormItem>
                                                    );
                                                }}
                                            />
                                        ))}
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};
