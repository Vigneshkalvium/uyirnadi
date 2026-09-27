export function ownedStoragePath(path:string,uid:string,folder?:string){
  const parts=path.split('/');
  return parts.length===4&&parts[0]==='users'&&parts[1]===uid&&['profile','prescriptions','health-reports'].includes(parts[2])&&(!folder||parts[2]===folder)&&/^[\w-]+$/.test(parts[3]);
}
