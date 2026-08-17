const fs = require('fs');
let code = fs.readFileSync('src/pages/Sell.tsx', 'utf8');

const target = `              <div className="mt-8 mb-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" variant="outline" className="text-white border-border hover:bg-white/[0.05]">
                      {formData.type || "Mobile Apps"} &rarr;
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="h-64 overflow-y-auto bg-card border-border">`;

const replacement = `              <div className="mt-8 mb-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" variant="outline" className="text-white border-border hover:bg-white/[0.05] h-14 px-8 text-lg font-medium w-full sm:w-auto shadow-sm">
                      {formData.type || "Mobile Apps"} &rarr;
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="h-80 w-72 overflow-y-auto bg-card border-border p-2">`;

code = code.replace(target, replacement);

const options = [
  "Utility Apps", "Social Media Apps", "E-commerce Apps", "Fitness & Health Apps", 
  "Finance & Banking Apps", "Education & Learning Apps", "Games (Casual)", 
  "Games (Hyper-Casual)", "Games (Puzzle)", "Games (Arcade)", "Productivity Apps", 
  "Travel & Booking Apps", "Food Delivery Apps", "Dating Apps", "News & Media Apps", 
  "Music & Audio Apps", "Photo & Video Editing Apps", "AR/VR Apps", "IoT Control Apps", 
  "Chat & Messaging Apps", "Reservation/Booking Apps", "Weather Apps", "Calculator/Utility Tools", 
  "QR/Barcode Scanner Apps", "Meditation & Wellness Apps", "Language Learning Apps"
];

options.forEach(opt => {
  const oldItem = `<DropdownMenuItem onSelect={() => setFormData({ ...formData, type: "${opt}" })}>${opt}</DropdownMenuItem>`;
  const newItem = `<DropdownMenuItem className="text-base py-3 px-4 cursor-pointer hover:bg-white/[0.05]" onSelect={() => setFormData({ ...formData, type: "${opt}" })}>${opt}</DropdownMenuItem>`;
  code = code.replace(oldItem, newItem);
});

fs.writeFileSync('src/pages/Sell.tsx', code);
