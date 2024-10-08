'use server';
import { sql } from '@vercel/postgres';
import { z } from 'zod'
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { AuthError } from 'next-auth';
import { signIn } from '@/auth';

export type State = {
    errors?: {
        customerId?: string[];
        amount?: string[];
        status?: string[];
    };
    message?: string | null;
};

const FormSchema = z.object({
    id: z.string(),
    customerId: z.string({
        invalid_type_error: 'Please select a customer.',
    }),
    amount: z.coerce.number().gt(0, { message: 'Please enter an amount greater than $0.' }),
    status: z.enum(['pending', 'paid'], {
        invalid_type_error: 'Please select an invoice status.',
    }),
    date: z.string(),
})

const CreateInvoice = FormSchema.omit({ id: true, date: true });

export async function createInvoice(prevState: State, formData: FormData) {
    const redirectRoute = '/dashboard/invoices';
    const validatedFields = CreateInvoice.safeParse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    });

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Missing Fields. Failed to Create Invoice.',
        };
    }
    const { customerId, amount, status } = validatedFields.data;
    const amountInCents = amount * 100;
    const date = new Date().toISOString().split('T')[0];
    try {
        await sql`INSERT INTO invoices (customer_id, amount, status, date) VALUES (${customerId}, ${amountInCents}, ${status}, ${date})`;
    } catch (error) {
        return { message: 'Database Error: Failed to Create Invoice.' };
    }
    revalidatePath(redirectRoute);
    redirect(redirectRoute);
}

const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export const updateInvoice = async (id: string, prevState: State, formData: FormData) => {
    const redirectRoute = '/dashboard/invoices';
    const validatedFields = CreateInvoice.safeParse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    });
    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Missing Fields. Failed to Create Invoice.',
        };
    }
    const { customerId, amount, status } = validatedFields.data;
    const amountInCents = amount * 100;
    const date = new Date().toISOString().split('T')[0];
    try {
        await sql`UPDATE invoices SET customer_id = ${customerId}, amount=${amountInCents}, status=${status}, date=${date} WHERE id=${id}`;
    } catch (error) {
        return { message: 'Database Error: Failed to Update Invoice.' };
    }
    revalidatePath(redirectRoute);
    redirect(redirectRoute);
}

export const deleteInvoice = async (id: string) => {
    throw new Error('Failed to Delete Invoice');
    const redirectRoute = '/dashboard/invoices';
    try {
        await sql`DELETE FROM invoices WHERE id=${id}`;
        redirect(redirectRoute);
    } catch (error) {
        return { message: 'Database Error: Failed to Delete Invoice.' };
    }
}

export const authenticate = async (
    prevState: string | undefined,
    formData: FormData,
) => {
    try {
        await signIn('credentials', formData)
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case 'CredentialsSignin':
                    return 'Invalid credentials.';
                default:
                    return 'Something went wrong.';
            }
        }
        throw error;
    }
}