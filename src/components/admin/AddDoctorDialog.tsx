import { useState } from 'react';
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
import { Specialty } from '@/hooks/useDoctors';

const formSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  first_name: z.string().min(2, { message: 'First name must be at least 2 characters' }),
  last_name: z.string().min(2, { message: 'Last name must be at least 2 characters' }),
  other_name: z.string().optional(),
  phone: z.string().min(10, { message: 'Phone number must be at least 10 characters' }),
  gender: z.string().optional(),
  specialty_id: z.string().min(1, { message: 'Please select a specialty' }),
  license_number: z.string().min(1, { message: 'License number is required' }),
  years_of_experience: z.string().min(1, { message: 'Years of experience is required' }),
  consultation_fee: z.string().min(1, { message: 'Consultation fee is required' }),
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
    { id: 'Fertility', name: 'Fertility', description: 'Reproductive health and fertility treatments', created_at: '' },
    { id: 'Gynaecology', name: 'Gynaecology', description: "Women's reproductive health", created_at: '' },
    { id: 'Obstetrics', name: 'Obstetrics', description: 'Pregnancy and childbirth care', created_at: '' },
    { id: 'Paediatrics', name: 'Paediatrics', description: 'Child healthcare', created_at: '' },
    { id: 'General Practice', name: 'General Practice', description: 'Primary healthcare services', created_at: '' },
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
      specialty_id: '',
      license_number: '',
      years_of_experience: '',
      consultation_fee: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    try {
      // Create the user account
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


      console.log({'authdata':authData})

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user');

      // Update user role to doctor
      const { error: roleError } = await supabase
        .from('user_roles')
        .update({ role: 'doctor' })
        .eq('user_id', authData.user.id);

      if (roleError) throw roleError;

      // Ensure specialty exists in DB. If the selected specialty id is not
      // one of the fetched specialties (i.e. we're using a default name),
      // upsert by name and use the returned id.
      let specialtyId = values.specialty_id;

      const found = specialties.find((s) => s.id === specialtyId);
      if (!found) {
        // treat specialtyId as a name and upsert
        try {
          const { data: specData, error: specError } = await supabase
            .from('specialties')
            .upsert({ name: specialtyId.trim(), description: null }, { onConflict: 'name' })
            .select('id')
            .limit(1)
            .maybeSingle();

          if (specError) throw specError;
          if (!specData || !specData.id) throw new Error('Failed to create/find specialty');
          specialtyId = specData.id;
        } catch (err: any) {
          console.error('Specialty upsert error:', err);

          // If the specialties table is missing in the database, surface a
          // clear message and stop the flow (PGRST205 comes from PostgREST)
          if (err?.code === 'PGRST205' || String(err?.message).includes("Could not find the table 'public.specialties'")) {
            toast({
              title: 'Database table missing',
              description:
                "The 'specialties' table is not present in your database. Run the project's migrations or run the SQL seed in the Supabase SQL editor (check README).",
              variant: 'destructive',
            });
            // stop the submit flow gracefully
            return;
          }

          // Other errors: rethrow so outer catch will handle and show toast
          throw new Error(err?.message || 'Failed to create specialty. Check RLS and permissions.');
        }
      }

      // Create doctor record
      const { error: doctorError } = await supabase.from('doctors').insert({
        user_id: authData.user.id,
        specialty_id: specialtyId,
        license_number: values.license_number,
        years_of_experience: parseInt(values.years_of_experience),
        consultation_fee: parseFloat(values.consultation_fee),
        available: true,
      });

      if (doctorError) {
        // Surface missing table error with a clear action
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

      console.log({'values':values})
      console.log({'doctor':doctorError})

      toast({
        title: 'Success',
        description: 'Doctor added successfully',
      });

      form.reset();
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.log({'error':error})
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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                    <Input type="password" placeholder="••••••••" {...field} />
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
              name="specialty_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Specialty</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select specialty" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(specialties && specialties.length > 0 ? specialties : defaultSpecialties).map((specialty) => (
                        <SelectItem key={specialty.id} value={specialty.id}>
                          {specialty.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="license_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>License Number</FormLabel>
                  <FormControl>
                    <Input placeholder="MD12345" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="years_of_experience"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Years of Experience</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="5" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="consultation_fee"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Consultation Fee (GHS)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="45.00" {...field} />
                  </FormControl>
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
