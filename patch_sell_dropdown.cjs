const fs = require('fs');
let code = fs.readFileSync('src/pages/Sell.tsx', 'utf8');

if (!code.includes('DropdownMenu')) {
  code = code.replace(
    'import { Button } from "@/components/ui/button";',
    'import { Button } from "@/components/ui/button";\nimport { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";'
  );
}

const target = `              <div className="mt-8 mb-4">
                <Button type="button" variant="outline" className="text-white border-border hover:bg-white/[0.05]">
                  Mobile Apps &rarr;
                </Button>
              </div>`;

const options = [
  "Utility Apps", "Social Media Apps", "E-commerce Apps", "Fitness & Health Apps", 
  "Finance & Banking Apps", "Education & Learning Apps", "Games (Casual)", 
  "Games (Hyper-Casual)", "Games (Puzzle)", "Games (Arcade)", "Productivity Apps", 
  "Travel & Booking Apps", "Food Delivery Apps", "Dating Apps", "News & Media Apps", 
  "Music & Audio Apps", "Photo & Video Editing Apps", "AR/VR Apps", "IoT Control Apps", 
  "Chat & Messaging Apps", "Reservation/Booking Apps", "Weather Apps", "Calculator/Utility Tools", 
  "QR/Barcode Scanner Apps", "Meditation & Wellness Apps", "Language Learning Apps"
];

const replacement = `              <div className="mt-8 mb-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" variant="outline" className="text-white border-border hover:bg-white/[0.05]">
                      Mobile Apps &rarr;
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="h-64 overflow-y-auto bg-card border-border">
                    ${options.map(opt => `<DropdownMenuItem onSelect={() => setFormData({ ...formData, type: "${opt}" })}>${opt}</DropdownMenuItem>`).join('\\n                    ')}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>`;

code = code.replace(target, replacement);

fs.writeFileSync('src/pages/Sell.tsx', code);
