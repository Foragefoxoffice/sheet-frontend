// Example of using Ant Design components in your forms
// Import Ant Design components and styles at the top of your files

import { Select, DatePicker, TimePicker, Input, Button, Form } from 'antd';
import 'antd/dist/reset.css'; // Import Ant Design styles

// Example usage in a form:

// 1. SELECT DROPDOWN (for user selection, priority, status, etc.)
<Select
    placeholder="Select a user"
    style={{ width: '100%' }}
    size="large"
    showSearch
    optionFilterProp="children"
    onChange={(value) => handleChange(value)}
>
    <Select.Option value="user1">John Doe (Manager)</Select.Option>
    <Select.Option value="user2">Jane Smith (Staff)</Select.Option>
</Select>

// 2. DATE PICKER
<DatePicker
    style={{ width: '100%' }}
    size="large"
    format="DD/MM/YYYY"
    onChange={(date) => handleDateChange(date)}
/>

// 3. TIME PICKER
<TimePicker
    style={{ width: '100%' }}
    size="large"
    format="HH:mm"
    onChange={(time) => handleTimeChange(time)}
/>

// 4. TEXT INPUT
<Input
    placeholder="Enter task description"
    size="large"
    onChange={(e) => handleInputChange(e.target.value)}
/>

// 5. TEXTAREA
<Input.TextArea
    rows={4}
    placeholder="Add notes..."
    size="large"
    onChange={(e) => handleNotesChange(e.target.value)}
/>

// 6. BUTTON
<Button type="primary" size="large" onClick={handleSubmit}>
    Submit
</Button>

// 7. FORM WRAPPER (recommended for better validation)
<Form
    layout="vertical"
    onFinish={handleSubmit}
>
    <Form.Item
        label="Task Description"
        name="task"
        rules={[{ required: true, message: 'Please enter task description' }]}
    >
        <Input.TextArea rows={4} />
    </Form.Item>
    
    <Form.Item
        label="Assign To"
        name="assignedTo"
        rules={[{ required: true, message: 'Please select a user' }]}
    >
        <Select placeholder="Select a user">
            <Select.Option value="user1">John Doe</Select.Option>
        </Select>
    </Form.Item>
    
    <Form.Item>
        <Button type="primary" htmlType="submit">
            Create Task
        </Button>
    </Form.Item>
</Form>

// CUSTOMIZING ANT DESIGN THEME
// You can customize colors in your main CSS file or using ConfigProvider:

import { ConfigProvider } from 'antd';

<ConfigProvider
    theme={{
        token: {
            colorPrimary: '#1877F2', // Your primary color
            borderRadius: 8,
            fontSize: 14,
        },
    }}
>
    {/* Your app components */}
</ConfigProvider>
