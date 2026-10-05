import {
  ArrowRight,
  MapPin,
} from "lucide-react";

export default function GymCard({
  name,
  location,
  image,
  status = "ACTIVE",
}) {
  const active = status === "ACTIVE";

  return (
    <div className="sa-gym-card">
      <div
        className="sa-gym-image"
        style={{
          backgroundImage: `url(${image})`,
        }}
      />

      <div className="sa-gym-content">
        <div className="sa-gym-title-row">
          <h3>{name}</h3>

          <span className={`sa-status ${active ? "active" : "inactive"}`}>
            {active ? "Active" : "Inactive"}
          </span>
        </div>

        <div className="sa-gym-meta">
          <span>
            <MapPin size={14} />
            {location}
          </span>
        </div>

        <button className="sa-view-btn">
          View Details
          <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}