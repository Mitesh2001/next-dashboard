'use server';
import { sql } from '@vercel/postgres';
import { z } from 'zod'
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

const FormSchema = z.object({
    id: z.string(),
    customerId: z.string(),
    amount: z.coerce.number(),
    status: z.enum(['pending', 'paid']),
    date: z.string(),
})

const CreateInvoice = FormSchema.omit({ id: true, date: true });

export const createInvoice = async (formData: FormData) => {
    const redirectRoute = '/dashboard/invoices';
    const { customerId, amount, status } = CreateInvoice.parse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    });
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

export const updateInvoice = async (id: string, formData: FormData) => {
    const redirectRoute = '/dashboard/invoices';
    const { customerId, amount, status } = UpdateInvoice.parse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
    });
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