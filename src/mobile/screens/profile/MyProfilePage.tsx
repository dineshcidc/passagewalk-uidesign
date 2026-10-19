import { useState } from "react";
import AppIcon from "../../components/AppIcon";
import { ageRanges, birthMonths, genders, getFullName, type UserProfile } from "../../data/user";
import ProfileSubpageHeader from "./ProfileSubpageHeader";

export default function MyProfilePage({
  onBack,
  user,
  onUpdate,
}: {
  onBack: () => void;
  user: UserProfile;
  onUpdate: (user: UserProfile) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(user);
  const setField = (field: keyof UserProfile) => (value: string) => setDraft((current) => ({ ...current, [field]: value }));
  // Sign Up details (client slide 8); fields left empty at Sign Up show "Not added".
  const details = [
    { label: "Age range", value: user.ageRange },
    { label: "Gender", value: user.gender },
    { label: "Birthday month", value: user.birthMonth },
  ];

  const cancelEditing = () => {
    setDraft(user);
    setEditing(false);
  };

  const updateProfile = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onUpdate({ ...draft, firstName: draft.firstName.trim(), lastName: draft.lastName.trim(), email: draft.email.trim().toLowerCase() });
    setEditing(false);
  };

  return (
    <div className="profile-subpage">
      <ProfileSubpageHeader title="My Profile" onBack={onBack} />
      <div className="my-profile-content">
        <span className="profile-section-label">ACCOUNT INFORMATION</span>
        {editing ? (
          <form className="edit-profile-card" onSubmit={updateProfile}>
            <div className="edit-profile-photo">
              <img src={draft.photo} alt="Profile preview" />
              <label>
                <AppIcon name="camera" />
                Replace Photo
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) setField("photo")(URL.createObjectURL(file));
                  }}
                />
              </label>
            </div>
            <div className="edit-profile-row">
              <label className="edit-profile-field">
                <span>First name</span>
                <input value={draft.firstName} onChange={(event) => setField("firstName")(event.target.value)} required />
              </label>
              <label className="edit-profile-field">
                <span>Last name</span>
                <input value={draft.lastName} onChange={(event) => setField("lastName")(event.target.value)} />
              </label>
            </div>
            <label className="edit-profile-field">
              <span>Email address</span>
              <input type="email" value={draft.email} onChange={(event) => setField("email")(event.target.value)} required />
            </label>
            <div className="edit-profile-row">
              <label className="edit-profile-field">
                <span>Age range</span>
                <select value={draft.ageRange} onChange={(event) => setField("ageRange")(event.target.value)}>
                  <option value="">Not added</option>
                  {ageRanges.map((option) => <option key={option}>{option}</option>)}
                </select>
              </label>
              <label className="edit-profile-field">
                <span>Gender</span>
                <select value={draft.gender} onChange={(event) => setField("gender")(event.target.value)}>
                  <option value="">Not added</option>
                  {genders.map((option) => <option key={option}>{option}</option>)}
                </select>
              </label>
            </div>
            <label className="edit-profile-field">
              <span>Birthday month</span>
              <select value={draft.birthMonth} onChange={(event) => setField("birthMonth")(event.target.value)}>
                <option value="">Not added</option>
                {birthMonths.map((option) => <option key={option}>{option}</option>)}
              </select>
            </label>
            <div className="edit-profile-actions">
              <button type="button" onClick={cancelEditing}>Cancel</button>
              <button type="submit">Update Profile</button>
            </div>
          </form>
        ) : (
          <>
            <section className="my-profile-card">
              <img src={user.photo} alt={`${user.firstName}'s profile`} />
              <h1>{getFullName(user)}</h1>
              <p>{user.email}</p>
              <dl className="my-profile-details">
                {details.map((item) => (
                  <div key={item.label}>
                    <dt>{item.label}</dt>
                    <dd className={item.value ? "" : "empty"}>{item.value || "Not added"}</dd>
                  </div>
                ))}
              </dl>
              <button onClick={() => { setDraft(user); setEditing(true); }}><AppIcon name="edit" />Edit Profile</button>
            </section>
            <p className="my-profile-note">Your profile information is used to personalize your Passage Walk journey.</p>
          </>
        )}
      </div>
    </div>
  );
}
