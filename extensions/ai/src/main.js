import { UsagePopover } from "@/usage/popover-app";
import "@/styles/global.css";

const root = document.getElementById("root");
if (root) new UsagePopover(root).start();
