import { useState } from 'react';
import { sendEmail } from '@/lib/emailService';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Specialty } from '@/hooks/useDoctors';

const formSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  first_name: z.string().min(2, { message: 'First name must be at least 2 characters' }),
  last_name: z.string().min(2, { message: 'Last name must be at least 2 characters' }),
  other_name: z.string().optional(),
  phone: z.string().min(10, { message: 'Phone number must be at least 10 characters' }),
  gender: z.string().optional(),
  specialty_ids: z.array(z.string()).min(1, { message: 'Please select at least one specialty' }),
});

interface AddDoctorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  specialties: Specialty[];
  onSuccess: () => void;
}

export const AddDoctorDialog = ({
  open,
  onOpenChange,
  specialties,
  onSuccess,
}: AddDoctorDialogProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Default specialties to show in the UI so admins can pick common fields
  const defaultSpecialties: Specialty[] = [
    { id: 'Fertility', name: 'Fertility', description: 'Reproductive health and fertility treatments', cost: null, created_at: '' },
    { id: 'Gynaecology', name: 'Gynaecology', description: "Women's reproductive health", cost: null, created_at: '' },
    { id: 'Obstetrics', name: 'Obstetrics', description: 'Pregnancy and childbirth care', cost: null, created_at: '' },
    { id: 'Paediatrics', name: 'Paediatrics', description: 'Child healthcare', cost: null, created_at: '' },
    { id: 'General Practice', name: 'General Practice', description: 'Primary healthcare services', cost: null, created_at: '' },
  ];

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      first_name: '',
      last_name: '',
      other_name: '',
      phone: '',
      gender: '',
      specialty_ids: [],
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    try {
      // Check if user already exists in profiles (e.g. previously deleted doctor)
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', values.email)
        .maybeSingle();

      let userId = existingProfile?.id;

      if (!userId) {
        // Save admin session to restore after signup
        const { data: { session: currentSession } } = await supabase.auth.getSession();

        // Create the user account via standard signup
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: values.email,
          password: values.password,
          options: {
            data: {
              first_name: values.first_name,
              last_name: values.last_name,
              other_name: values.other_name || '',
              phone: values.phone,
              gender: values.gender || null,
            },
          },
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error('Failed to create user');
        
        userId = authData.user.id;

        // Restore admin session immediately so RLS policies pass for subsequent inserts
        if (currentSession) {
          await supabase.auth.setSession({
            access_token: currentSession.access_token,
            refresh_token: currentSession.refresh_token,
          });
        }
      } else {
        // We found an existing user, update their profile with the new details
        const { error: profileUpdateError } = await supabase
          .from('profiles')
          .update({
            first_name: values.first_name,
            last_name: values.last_name,
            other_name: values.other_name || null,
            phone: values.phone,
            gender: values.gender || null,
            full_name: `${values.first_name} ${values.last_name}`.trim(),
          })
          .eq('id', userId);
        
        if (profileUpdateError) throw profileUpdateError;
      }

      // First try to check if user_roles exists, if not insert, else update
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (existingRole) {
        const { error: roleError } = await supabase
          .from('user_roles')
          .update({ role: 'doctor' })
          .eq('user_id', userId);
        if (roleError) throw roleError;
      } else {
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: 'doctor' });
        if (roleError) throw roleError;
      }

      // Ensure specialty exists in DB.
      let resolvedSpecialtyIds: string[] = [];

      for (const specId of values.specialty_ids) {
        const found = specialties.find((s) => s.id === specId);
        if (!found) {
          // treat specId as a name and upsert
          try {
            const { data: specData, error: specError } = await supabase
              .from('specialties')
              .upsert({ name: specId.trim(), description: null }, { onConflict: 'name' })
              .select('id')
              .limit(1)
              .maybeSingle();

            if (specError) throw specError;
            if (specData && specData.id) {
              resolvedSpecialtyIds.push(specData.id);
            }
          } catch (err: any) {
            console.error('Specialty upsert error:', err);
            throw new Error(err?.message || 'Failed to create specialty. Check RLS and permissions.');
          }
        } else {
          resolvedSpecialtyIds.push(specId);
        }
      }

      // Create doctor record
      const { data: doctorData, error: doctorError } = await supabase.from('doctors').insert({
        user_id: userId,
        years_of_experience: 0,
        available: true,
      }).select('id').single();



      if (doctorError) {
        if (
          (doctorError as any)?.code === 'PGRST205' ||
          String((doctorError as any)?.message).includes("Could not find the table 'public.doctors'")
        ) {
          toast({
            title: 'Database table missing',
            description:
              "The 'doctors' table is not present in your database. Run the project's migrations or paste the SQL from supabase/migrations into Supabase SQL editor.",
            variant: 'destructive',
          });
          return;
        }
        throw doctorError;
      }

      const doctorId = doctorData?.id;

      if (doctorId && resolvedSpecialtyIds.length > 0) {
        // Insert into junction table
        const { error: junctionError } = await supabase.from('doctor_specialties').insert(
          resolvedSpecialtyIds.map(sId => ({
            doctor_id: doctorId,
            specialty_id: sId
          }))
        );
        if (junctionError) throw junctionError;
      }

      console.log({ 'values': values })
      console.log({ 'doctor': doctorError })

      toast({
        title: 'Success',
        description: 'Doctor added successfully',
      });

      // Send welcome email to the new doctor
      sendEmail('doctor_welcome', {
        email: values.email,
        name: `${values.first_name} ${values.last_name}`,
        tempPassword: values.password,
        loginUrl: `${window.location.origin}/auth`,
      });

      form.reset();
      onOpenChange(false);
      
      // Delay fetch to allow Supabase trigger to create the profile
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (error: any) {
      console.log({ 'error': error })
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Doctor</DialogTitle>
          <DialogDescription>
            Create a new doctor account and profile
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" autoComplete="off">
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="other_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Other Name (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Michael" {...field} />
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
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="doctor@hospital.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" autoComplete="new-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="+233 24 123 4567" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gender (Optional)</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                      <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
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
                    <FormLabel className="text-base">Specialties</FormLabel>
                    <DialogDescription>
                      Select all specialties that apply to this doctor.
                    </DialogDescription>
                  </div>
                  <div className="grid grid-cols-2 gap-2 border rounded-md p-4 max-h-48 overflow-y-auto">
                    {(specialties && specialties.length > 0 ? specialties : defaultSpecialties).map((specialty) => (
                      <FormField
                        key={specialty.id}
                        control={form.control}
                        name="specialty_ids"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={specialty.id}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(specialty.id)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...(field.value || []), specialty.id])
                                      : field.onChange(
                                        field.value?.filter(
                                          (value) => value !== specialty.id
                                        )
                                      )
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer text-sm">
                                {specialty.name}
                              </FormLabel>
                            </FormItem>
                          )
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
                {loading ? 'Adding...' : 'Add Doctor'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
