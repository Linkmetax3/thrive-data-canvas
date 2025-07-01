
-- Add missing columns to customers table
ALTER TABLE public.customers 
ADD COLUMN total_purchases NUMERIC DEFAULT 0;

-- Add missing columns to suppliers table  
ALTER TABLE public.suppliers 
ADD COLUMN payment_details JSONB,
ADD COLUMN outstanding_balance NUMERIC DEFAULT 0,
ADD COLUMN last_payment_date DATE;

-- Create invoices table
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number TEXT NOT NULL,
  customer_id UUID REFERENCES public.customers(id),
  customer_name TEXT NOT NULL,
  business_id UUID NOT NULL REFERENCES public.businesses(id),
  issue_date DATE NOT NULL,
  due_date DATE,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  tax NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on invoices
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for invoices
CREATE POLICY "Users can view invoices from accessible businesses"
  ON public.invoices
  FOR SELECT
  USING (user_has_business_access(business_id));

CREATE POLICY "Users can manage invoices in accessible businesses"
  ON public.invoices
  FOR ALL
  USING (user_has_business_access(business_id));

-- Add trigger to automatically update updated_at for invoices
CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add comment to explain suppliers payment_details structure
COMMENT ON COLUMN public.suppliers.payment_details IS 'JSON object containing bank details: {bank_name, account_number, account_holder, swift_code, reference}';
