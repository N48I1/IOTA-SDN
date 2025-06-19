import { useRef, useEffect } from "react";
import { NetworkTopology, NetworkNode, NetworkLink } from "@/types";
import { cn } from "@/lib/utils";

interface NetworkTopologyViewProps {
  topology: NetworkTopology | null;
  className?: string;
}

const NetworkTopologyView = ({ topology, className }: NetworkTopologyViewProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Function to draw the network topology on canvas
  useEffect(() => {
    console.log("NetworkTopologyView useEffect triggered. Topology value: ", topology);

    const canvas = canvasRef.current;
    if (!canvas) {
      console.log("Canvas ref not available.");
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.log("Canvas context not available.");
      return;
    }

    // Vérifier si topology est null avant de tenter d'accéder à ses propriétés
    if (!topology) {
      console.log("Topology is null, clearing canvas and returning.");
      ctx.clearRect(0, 0, canvas.width, canvas.height); // Effacer le canevas si pas de topologie
      return; // Sortir si topology est null
    }

    console.log("Topology is not null. Proceeding to draw.");

    // Set canvas size to match its display size
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw links
    topology.links.forEach(link => {
      const sourceNode = topology.nodes.find(node => node.id === link.source);
      const targetNode = topology.nodes.find(node => node.id === link.target);

      if (sourceNode && targetNode) {
        ctx.beginPath();
        ctx.moveTo(sourceNode.x, sourceNode.y);
        ctx.lineTo(targetNode.x, targetNode.y);

        if (link.status === undefined) {
          ctx.strokeStyle = 'hsl(215.4 16.3% 46.9%)'; // muted-foreground
        } else if (link.status) {
          ctx.strokeStyle = 'hsl(142.1 76.2% 36.3%)'; // blockchain-success
        } else {
          ctx.strokeStyle = 'hsl(0 84.2% 60.2%)'; // blockchain-danger
        }

        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });

    // Draw nodes
    topology.nodes.forEach(node => {
      ctx.beginPath();

      // Different colors for different node types
      switch (node.type) {
        case 'controller':
          ctx.fillStyle = 'hsl(221 83% 53%)'; // primary
          ctx.strokeStyle = 'hsl(221 83% 40%)'; // darker primary
          break;
        case 'switch':
          ctx.fillStyle = 'hsl(210 40% 96.1%)'; // secondary
          ctx.strokeStyle = 'hsl(210 40% 80%)'; // darker secondary
          break;
        case 'host':
          ctx.fillStyle = 'hsl(210 40% 96.1%)'; // muted
          ctx.strokeStyle = 'hsl(210 40% 80%)'; // darker muted
          break;
        default:
          ctx.fillStyle = 'hsl(215.4 16.3% 46.9%)'; // muted-foreground
          ctx.strokeStyle = 'hsl(215.4 16.3% 30%)'; // darker muted-foreground
      }

      // Draw node
      ctx.arc(node.x, node.y, 15, 0, 2 * Math.PI);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.stroke();

      // Add node label
      ctx.fillStyle = 'hsl(222.2 84% 4.9%)'; // foreground (dark text)
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.id, node.x, node.y);

      // Add node type and IP below the node
      ctx.fillStyle = 'hsl(215.4 16.3% 46.9%)'; // muted-foreground
      ctx.font = '10px sans-serif';
      ctx.fillText(node.type, node.x, node.y + 30);
      if (node.ip) {
        ctx.fillText(node.ip, node.x, node.y + 45);
      }
    });

  }, [topology]);

  return (
    <div className={cn("blockchain-card h-full flex items-center justify-center p-0", className)}>
      <canvas
        ref={canvasRef}
        className="w-full h-full rounded-lg"
      />
    </div>
  );
};

export default NetworkTopologyView;
