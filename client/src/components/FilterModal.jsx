import { useState } from 'react';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import IconButton from '@mui/material/IconButton';
import { X, Plus, Trash2, Filter as FilterIcon } from 'lucide-react';

const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 700,
    maxHeight: '90vh',
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 4,
    overflow: 'auto',
    borderRadius: 2,
};

const OPERATORS = [
    { value: 'contains', label: 'Contains' },
    { value: 'equals', label: 'Equals' },
    { value: 'starts_with', label: 'Starts With' },
    { value: 'ends_with', label: 'Ends With' },
    { value: 'is_empty', label: 'Is Empty' },
    { value: 'is_not_empty', label: 'Is Not Empty' },
    { value: 'greater_than', label: 'Greater Than' },
    { value: 'less_than', label: 'Less Than' },
    { value: 'greater_than_or_equal', label: 'Greater Than or Equal' },
    { value: 'less_than_or_equal', label: 'Less Than or Equal' },
];

export default function FilterModal({ open, onClose, columns, onApplyFilters }) {
    const [filters, setFilters] = useState([
        { column: '', operator: 'contains', value: '' }
    ]);

    const addFilter = () => {
        setFilters([...filters, { column: '', operator: 'contains', value: '' }]);
    };

    const removeFilter = (index) => {
        const newFilters = filters.filter((_, i) => i !== index);
        setFilters(newFilters.length > 0 ? newFilters : [{ column: '', operator: 'contains', value: '' }]);
    };

    const updateFilter = (index, field, value) => {
        const newFilters = [...filters];
        newFilters[index][field] = value;
        setFilters(newFilters);
    };

    const handleApply = () => {
        const validFilters = filters.filter(f => f.column && f.operator);
        onApplyFilters(validFilters);
        onClose();
    };

    const handleClear = () => {
        setFilters([{ column: '', operator: 'contains', value: '' }]);
        onApplyFilters([]);
        onClose();
    };

    const needsValue = (operator) => {
        return !['is_empty', 'is_not_empty'].includes(operator);
    };

    return (
        <Modal open={open} onClose={onClose}>
            <Box sx={modalStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FilterIcon size={24} />
                        <Typography variant="h5" component="h2">
                            Advanced Filters
                        </Typography>
                    </div>
                    <IconButton onClick={onClose}>
                        <X size={20} />
                    </IconButton>
                </div>

                <Box sx={{ mb: 3 }}>
                    {filters.map((filter, index) => (
                        <Box 
                            key={index} 
                            sx={{ 
                                display: 'flex', 
                                gap: 2, 
                                mb: 2, 
                                alignItems: 'flex-start',
                                p: 2,
                                bgcolor: '#f5f5f5',
                                borderRadius: 1
                            }}
                        >
                            <FormControl sx={{ flex: 1 }} size="small">
                                <InputLabel>Column</InputLabel>
                                <Select
                                    value={filter.column}
                                    label="Column"
                                    onChange={(e) => updateFilter(index, 'column', e.target.value)}
                                >
                                    {columns.map((col) => (
                                        <MenuItem key={col} value={col}>
                                            {col}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            <FormControl sx={{ flex: 1 }} size="small">
                                <InputLabel>Operator</InputLabel>
                                <Select
                                    value={filter.operator}
                                    label="Operator"
                                    onChange={(e) => updateFilter(index, 'operator', e.target.value)}
                                >
                                    {OPERATORS.map((op) => (
                                        <MenuItem key={op.value} value={op.value}>
                                            {op.label}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            {needsValue(filter.operator) && (
                                <TextField
                                    sx={{ flex: 1 }}
                                    size="small"
                                    label="Value"
                                    value={filter.value}
                                    onChange={(e) => updateFilter(index, 'value', e.target.value)}
                                />
                            )}

                            <IconButton 
                                onClick={() => removeFilter(index)}
                                color="error"
                                disabled={filters.length === 1}
                            >
                                <Trash2 size={20} />
                            </IconButton>
                        </Box>
                    ))}

                    <Button
                        startIcon={<Plus size={16} />}
                        onClick={addFilter}
                        variant="outlined"
                        size="small"
                    >
                        Add Filter
                    </Button>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
                    <Button variant="outlined" onClick={handleClear}>
                        Clear All
                    </Button>
                    <Button variant="contained" onClick={handleApply}>
                        Apply Filters
                    </Button>
                </Box>
            </Box>
        </Modal>
    );
}