
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useCreateTransaction } from '@/hooks/useCreateTransaction';
import { useEmployees } from '@/hooks/useEmployees';
import { toast } from '@/hooks/use-toast';
import { DollarSign } from 'lucide-react';
import type { BusinessWithAll } from '@/types/database';

interface CostTrackingFormProps {
  selectedBusiness: BusinessWithAll;
  onClose: () => void;
}

export const CostTrackingForm = ({ selectedBusiness, onClose }: CostTrackingFormProps) => {
  const [formData, setFormData] = useState({
    employeeId: '',
    costType: 'salary' as 'salary' | 'bonus' | 'benefits' | 'overtime',
    amount: 0,
    hoursWorked: 0,
    hourlyRate: 0,
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  const businessId = selectedBusiness !== 'All' ? selectedBusiness.id : '';
  const { data: employees = [] } = useEmployees(businessId);
  const createTransaction = useCreateTransaction();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!businessId) {
      toast({
        title: "Error",
        description: "Please select a specific business to track costs.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.employeeId) {
      toast({
        title: "Error",
        description: "Please select an employee.",
        variant: "destructive",
      });
      return;
    }

    const selectedEmployee = employees.find(emp => emp.id === formData.employeeId);
    if (!selectedEmployee) {
      toast({
        title: "Error",
        description: "Selected employee not found.",
        variant: "destructive",
      });
      return;
    }

    try {
      const transactionData = {
        date: formData.date,
        business_id: businessId,
        type: 'employee_cost' as const,
        amount: formData.amount,
        description: formData.description || `${formData.costType} payment`,
        customer_name: selectedEmployee.name,
        payment_method: 'bank_transfer' as const,
        payment_status: 'paid' as const,
        employee_id: formData.employeeId,
        employee_name: selectedEmployee.name,
        cost_type: formData.costType,
        hours_worked: formData.hoursWorked > 0 ? formData.hoursWorked : null,
        hourly_rate: formData.hourlyRate > 0 ? formData.hourlyRate : null,
      };

      await createTransaction.mutateAsync(transactionData);
      
      toast({
        title: "Success",
        description: "Employee cost recorded successfully.",
      });
      
      onClose();
    } catch (error) {
      console.error('Error recording employee cost:', error);
      toast({
        title: "Error",
        description: "Failed to record employee cost. Please try again.",
        variant: "destructive",
      });
    }
  };

  const calculateTotalAmount = () => {
    if (formData.costType === 'overtime' && formData.hoursWorked > 0 && formData.hourlyRate > 0) {
      return formData.hoursWorked * formData.hourlyRate;
    }
    return formData.amount;
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <DollarSign size={20} />
          <span>Track Employee Cost</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="employee">Employee *</Label>
            <Select 
              value={formData.employeeId} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, employeeId: value }))}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.name} - {employee.position || 'No position'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="costType">Cost Type *</Label>
            <Select
              value={formData.costType}
              onValueChange={(value: 'salary' | 'bonus' | 'benefits' | 'overtime') => 
                setFormData(prev => ({ ...prev, costType: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="salary">Salary</SelectItem>
                <SelectItem value="bonus">Bonus</SelectItem>
                <SelectItem value="benefits">Benefits</SelectItem>
                <SelectItem value="overtime">Overtime</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.costType === 'overtime' ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="hoursWorked">Hours Worked</Label>
                <Input
                  id="hoursWorked"
                  type="number"
                  step="0.5"
                  value={formData.hoursWorked || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    hoursWorked: parseFloat(e.target.value) || 0,
                    amount: calculateTotalAmount()
                  }))}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="hourlyRate">Hourly Rate</Label>
                <Input
                  id="hourlyRate"
                  type="number"
                  step="0.01"
                  value={formData.hourlyRate || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    hourlyRate: parseFloat(e.target.value) || 0,
                    amount: calculateTotalAmount()
                  }))}
                  placeholder="0.00"
                />
              </div>
            </div>
          ) : (
            <div>
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                placeholder="0.00"
                required
              />
            </div>
          )}

          {formData.costType === 'overtime' && formData.hoursWorked > 0 && formData.hourlyRate > 0 && (
            <div className="p-3 bg-slate-50 rounded-lg">
              <div className="text-sm text-slate-600">Total Amount:</div>
              <div className="text-lg font-semibold">R{calculateTotalAmount().toFixed(2)}</div>
            </div>
          )}

          <div>
            <Label htmlFor="date">Date *</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Optional description..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={createTransaction.isPending}>
              {createTransaction.isPending ? 'Recording...' : 'Record Cost'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
