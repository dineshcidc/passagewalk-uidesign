// Bundled locally so the prototype works offline (was loaded from Unsplash).
import profilePhoto from "../../assets/Profile.jpg";

export const profilePhotoUrl = profilePhoto;

// Sign Up profile options (client slide 8). Empty string = not added.
export const ageRanges = ["Under 18", "18–24", "25–34", "35–44", "45–54", "55–64", "65+"] as const;
export const genders = ["Female", "Male", "Prefer not to say"] as const;
export const birthMonths = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"] as const;

export type UserProfile = {
  firstName: string;
  lastName: string;
  email: string;
  photo: string;
  ageRange: string;
  gender: string;
  birthMonth: string;
};

// Prototype-only store: Sign Up fills it, My Profile edits it, Home / Welcome back / certificate read it.
let user: UserProfile = { firstName: "Dinesh", lastName: "", email: "dinesh@gmail.com", photo: profilePhotoUrl, ageRange: "", gender: "", birthMonth: "" };

export const getUser = () => user;
export const getFullName = (profile: UserProfile = user) => [profile.firstName, profile.lastName].filter(Boolean).join(" ");

export function updateUser(changes: Partial<UserProfile>) {
  user = { ...user, ...changes };
}

// Empty fields keep the demo defaults so Create Account works without typing (prototype rule).
export function signUpUser(details: Omit<UserProfile, "photo">) {
  user = {
    ...details,
    firstName: details.firstName.trim() || "Dinesh",
    lastName: details.lastName.trim(),
    email: details.email.trim().toLowerCase() || "dinesh@gmail.com",
    photo: profilePhotoUrl,
  };
}
